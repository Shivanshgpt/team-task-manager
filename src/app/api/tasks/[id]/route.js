import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { taskUpdateSchema } from "@/lib/validators";
import { ok, err, handleZod, safeRoute } from "@/lib/api";

async function loadTaskWithAccess(id, user) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: { include: { members: true } },
    },
  });
  if (!task) return { error: err("Task not found", 404) };
  const isMember = task.project.members.some((m) => m.userId === user.id);
  const isOwner = task.project.ownerId === user.id;
  const isAdmin = user.role === "ADMIN";
  const isAssignee = task.assigneeId === user.id;
  if (!isAdmin && !isOwner && !isMember && !isAssignee) {
    return { error: err("Forbidden", 403) };
  }
  return { task, isAdmin, isOwner, isAssignee, isMember };
}

export async function PATCH(req, { params }) {
  return safeRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const access = await loadTaskWithAccess(id, user);
    if (access.error) return access.error;

    const body = await req.json();
    const parsed = taskUpdateSchema.safeParse(body);
    const zErr = handleZod(parsed);
    if (zErr) return zErr;

    const { isAdmin, isOwner, isAssignee } = access;
    const data = { ...parsed.data };

    if (!isAdmin && !isOwner) {
      const allowed = {};
      if ("status" in data && isAssignee) allowed.status = data.status;
      Object.keys(data).forEach((k) => {
        if (!(k in allowed)) delete data[k];
      });
      Object.assign(data, allowed);
    } else {
      if (data.dueDate) data.dueDate = new Date(data.dueDate);
      if (data.dueDate === null) data.dueDate = null;
    }

    const updated = await prisma.task.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
    return ok({ task: updated });
  });
}

export async function DELETE(_req, { params }) {
  return safeRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const access = await loadTaskWithAccess(id, user);
    if (access.error) return access.error;
    if (!access.isAdmin && !access.isOwner && access.task.createdById !== user.id) {
      return err("Forbidden", 403);
    }
    await prisma.task.delete({ where: { id } });
    return ok({ success: true });
  });
}
