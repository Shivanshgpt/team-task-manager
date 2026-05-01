import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, safeRoute } from "@/lib/api";

export async function GET() {
  return safeRoute(async () => {
    const user = await requireUser();
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

    const [projects, tasks, myTasks] = await Promise.all([
      prisma.project.count({ where: projectFilter }),
      prisma.task.findMany({
        where: taskFilter,
        select: { id: true, status: true, dueDate: true, assigneeId: true },
      }),
      prisma.task.findMany({
        where: { assigneeId: user.id },
        include: { project: { select: { id: true, name: true } } },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
        take: 8,
      }),
    ]);

    const now = new Date();
    const stats = {
      projects,
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: tasks.filter((t) => t.status === "DONE").length,
      overdue: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE").length,
      assignedToMe: tasks.filter((t) => t.assigneeId === user.id).length,
    };

    return ok({ stats, myTasks });
  });
}
