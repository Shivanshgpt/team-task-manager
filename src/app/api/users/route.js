import { prisma } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/auth";
import { ok, safeRoute } from "@/lib/api";

export async function GET() {
  return safeRoute(async () => {
    await requireUser();
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return ok({ users });
  });
}
