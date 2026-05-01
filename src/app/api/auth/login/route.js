import { prisma } from "@/lib/db";
import { verifyPassword, signToken, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { ok, err, handleZod, safeRoute } from "@/lib/api";

export async function POST(req) {
  return safeRoute(async () => {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    const zErr = handleZod(parsed);
    if (zErr) return zErr;

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return err("Invalid credentials", 401);
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return err("Invalid credentials", 401);

    await setSessionCookie(signToken({ userId: user.id }));
    return ok({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  });
}
