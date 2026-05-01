import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProjectsClient from "@/components/ProjectsClient";

export const metadata = { title: "Projects — Atelier" };

export default async function ProjectsPage() {
  const user = await getSessionUser();
  const where =
    user.role === "ADMIN"
      ? {}
      : { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] };

  const [projects, users] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true, email: true } }),
  ]);

  const enriched = projects.map((p) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => t.status === "DONE").length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    const { tasks, ...rest } = p;
    return { ...rest, _count: { tasks: total }, _doneCount: done, _percent: percent };
  });

  return <ProjectsClient initialProjects={JSON.parse(JSON.stringify(enriched))} users={users} currentUser={user} />;
}
