import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, err, safeRoute } from "@/lib/api";

export async function PATCH(req, { params }) {
  return safeRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const role = body?.role;
    if (!["ADMIN", "MEMBER"].includes(role)) return err("Invalid role", 422);
    if (id === admin.id && role === "MEMBER") return err("Cannot demote yourself", 400);
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    return ok({ user });
  });
}

export async function DELETE(_req, { params }) {
  return safeRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    if (id === admin.id) return err("Cannot delete yourself", 400);
    await prisma.user.delete({ where: { id } });
    return ok({ success: true });
  });
}
