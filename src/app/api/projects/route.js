import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { projectSchema } from "@/lib/validators";
import { ok, handleZod, safeRoute } from "@/lib/api";

export async function GET() {
  return safeRoute(async () => {
    const user = await requireUser();
    const where =
      user.role === "ADMIN"
        ? {}
        : { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] };

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok({ projects });
  });
}

export async function POST(req) {
  return safeRoute(async () => {
    const user = await requireUser();
    const body = await req.json();
    const parsed = projectSchema.safeParse(body);
    const zErr = handleZod(parsed);
    if (zErr) return zErr;

    const { name, description, memberIds = [] } = parsed.data;
    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        ownerId: user.id,
        members: {
          create: memberIds.filter((id) => id !== user.id).map((userId) => ({ userId })),
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    return ok({ project }, { status: 201 });
  });
}
