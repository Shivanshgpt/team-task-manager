import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";
import AnimatedStat from "@/components/AnimatedStat";
import ActivityList from "@/components/ActivityList";
import { ArrowUpRight, AlertTriangle, CheckCircle2, Circle, Loader2, FolderKanban } from "lucide-react";

export const metadata = { title: "Dashboard — Atelier" };

async function loadDashboard(user) {
  const isAdmin = user.role === "ADMIN";
  const projectFilter = isAdmin
    ? {}
    : { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] };
  const taskFilter = isAdmin
    ? {}
    : {
        OR: [
          { assigneeId: user.id },
          { project: { ownerId: user.id } },
          { project: { members: { some: { userId: user.id } } } },
        ],
      };

  const [projects, tasks, myTasks, recentTasks, recentProjects] = await Promise.all([
    prisma.project.count({ where: projectFilter }),
    prisma.task.findMany({
      where: taskFilter,
      select: { id: true, status: true, dueDate: true, assigneeId: true },
    }),
    prisma.task.findMany({
      where: { assigneeId: user.id },
      include: { project: { select: { id: true, name: true } } },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      take: 6,
    }),
    prisma.task.findMany({
      where: taskFilter,
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.project.findMany({
      where: projectFilter,
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const now = new Date();

  const activity = [];
  for (const p of recentProjects) {
    activity.push({
      type: "project_created",
      at: p.createdAt,
      text: `created project “${p.name}”`,
      who: p.owner?.name,
    });
  }
  for (const t of recentTasks) {
    activity.push({
      type: "task_created",
      at: t.createdAt,
      text: `created “${t.title}” in ${t.project.name}`,
      who: t.createdBy?.name,
    });
    if (t.updatedAt && new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime() > 1000) {
      activity.push({
        type: "task_updated",
        at: t.updatedAt,
        text: `updated “${t.title}” → ${t.status.replace("_", " ").toLowerCase()}`,
        who: t.assignee?.name,
      });
    }
  }
  activity.sort((a, b) => new Date(b.at) - new Date(a.at));
  const workspaceActivity = activity.slice(0, 8);

  return {
    stats: {
      projects,
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: tasks.filter((t) => t.status === "DONE").length,
      overdue: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE").length,
    },
    myTasks,
    workspaceActivity,
  };
}

function StatBlock({ label, value, accent, icon: Icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-muted text-xs uppercase tracking-widest">{label}</p>
        {Icon && <Icon className={`w-4 h-4 text-${accent || "muted"}`} />}
      </div>
      <p className={`serif text-4xl tabular-nums ${accent ? `text-${accent}` : ""}`}>
        <AnimatedStat value={value} />
      </p>
    </div>
  );
}

export default async function Dashboard() {
  const user = await getSessionUser();
  const { stats, myTasks, workspaceActivity } = await loadDashboard(user);

  const greeting =
    new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-10 fade-in">
      <header>
        <p className="text-muted text-xs uppercase tracking-widest mb-2">{greeting}</p>
        <h1 className="serif text-4xl">Hello, {user.name.split(" ")[0]}.</h1>
        <p className="mt-2 text-ink-2">
          {user.role === "ADMIN" ? "Workspace overview." : "Here's what's on your plate."}
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatBlock label="Projects" value={stats.projects} icon={FolderKanban} />
        <StatBlock label="To do" value={stats.todo} icon={Circle} />
        <StatBlock label="In progress" value={stats.inProgress} accent="amber" icon={Loader2} />
        <StatBlock label="Done" value={stats.done} accent="accent" icon={CheckCircle2} />
        <StatBlock label="Overdue" value={stats.overdue} accent="rose" icon={AlertTriangle} />
      </section>

      <section className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-muted text-xs uppercase tracking-widest mb-1">Your queue</p>
              <h2 className="serif text-2xl">Tasks assigned to you</h2>
            </div>
            <Link href="/tasks?mine=1" className="btn btn-ghost text-sm">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {myTasks.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="serif text-xl mb-2">Inbox zero.</p>
              <p className="text-muted text-sm">No tasks assigned to you. Enjoy the quiet.</p>
            </div>
          ) : (
            <div className="card divide-y">
              {myTasks.map((t) => {
                const overdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE";
                return (
                  <Link
                    key={t.id}
                    href={`/projects/${t.project.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-paper-2 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {t.project.name}
                        {t.dueDate && (
                          <>
                            {" · "}
                            <span className={overdue ? "text-rose" : ""}>
                              Due {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {overdue && <span className="badge badge-overdue">Overdue</span>}
                      <StatusBadge status={t.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="mb-4">
            <p className="text-muted text-xs uppercase tracking-widest mb-1">Pulse</p>
            <h2 className="serif text-2xl">Across the workspace</h2>
          </div>
          <ActivityList items={workspaceActivity} />
        </div>
      </section>
    </div>
  );
}
