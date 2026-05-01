import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { projectSchema } from "@/lib/validators";
import { ok, err, handleZod, safeRoute } from "@/lib/api";

async function loadAccessible(id, user) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: {
        include: { assignee: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!project) return { error: err("Project not found", 404) };
  const isMember = project.members.some((m) => m.userId === user.id);
  if (user.role !== "ADMIN" && project.ownerId !== user.id && !isMember) {
    return { error: err("Forbidden", 403) };
  }
  return { project };
}

export async function GET(_req, { params }) {
  return safeRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const { project, error } = await loadAccessible(id, user);
    if (error) return error;
    return ok({ project });
  });
}

export async function PATCH(req, { params }) {
  return safeRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) return err("Project not found", 404);
    if (user.role !== "ADMIN" && existing.ownerId !== user.id) return err("Forbidden", 403);

    const body = await req.json();
    const parsed = projectSchema.partial().safeParse(body);
    const zErr = handleZod(parsed);
    if (zErr) return zErr;

    const { name, description, memberIds } = parsed.data;
    const updated = await prisma.$transaction(async (tx) => {
      if (memberIds) {
        await tx.projectMember.deleteMany({ where: { projectId: id } });
        await tx.projectMember.createMany({
          data: memberIds.filter((uid) => uid !== existing.ownerId).map((userId) => ({ projectId: id, userId })),
        });
      }
      return tx.project.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      });
    });
    return ok({ project: updated });
  });
}

export async function DELETE(_req, { params }) {
  return safeRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) return err("Project not found", 404);
    if (user.role !== "ADMIN" && existing.ownerId !== user.id) return err("Forbidden", 403);
    await prisma.project.delete({ where: { id } });
    return ok({ success: true });
  });
}
