import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TasksClient from "@/components/TasksClient";

export const metadata = { title: "Tasks — Atelier" };

export default async function TasksPage({ searchParams }) {
  const sp = await searchParams;
  const user = await getSessionUser();
  const mine = sp?.mine === "1";

  const baseAccess = user.role === "ADMIN"
    ? {}
    : {
        OR: [
          { assigneeId: user.id },
          { project: { ownerId: user.id } },
          { project: { members: { some: { userId: user.id } } } },
        ],
      };

  const where = mine ? { ...baseAccess, assigneeId: user.id } : baseAccess;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return <TasksClient initialTasks={JSON.parse(JSON.stringify(tasks))} currentUser={user} mineOnly={mine} />;
}
