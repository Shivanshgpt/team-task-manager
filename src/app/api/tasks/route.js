import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { taskSchema } from "@/lib/validators";
import { ok, err, handleZod, safeRoute } from "@/lib/api";

export async function GET(req) {
  return safeRoute(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const mine = searchParams.get("mine");

    const where = {};
    if (projectId) where.projectId = projectId;
    if (mine === "1") where.assigneeId = user.id;

    if (user.role !== "ADMIN") {
      where.OR = [
        { assigneeId: user.id },
        { createdById: user.id },
        { project: { ownerId: user.id } },
        { project: { members: { some: { userId: user.id } } } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });
    return ok({ tasks });
  });
}

export async function POST(req) {
  return safeRoute(async () => {
    const user = await requireUser();
    const body = await req.json();
    const parsed = taskSchema.safeParse(body);
    const zErr = handleZod(parsed);
    if (zErr) return zErr;

    const { title, description, status, priority, dueDate, projectId, assigneeId } = parsed.data;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project) return err("Project not found", 404);

    const isMember = project.members.some((m) => m.userId === user.id);
    if (user.role !== "ADMIN" && project.ownerId !== user.id && !isMember) {
      return err("Forbidden", 403);
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        createdById: user.id,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
    return ok({ task }, { status: 201 });
  });
}
