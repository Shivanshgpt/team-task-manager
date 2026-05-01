import { prisma } from "@/lib/db";
import { hashPassword, signToken, setSessionCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/validators";
import { ok, err, handleZod, safeRoute } from "@/lib/api";

export async function POST(req) {
  return safeRoute(async () => {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    const zErr = handleZod(parsed);
    if (zErr) return zErr;

    const { name, email, password } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return err("Email already registered", 409);

    const userCount = await prisma.user.count();
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const isFirstOrSeededAdmin = userCount === 0 || (adminEmail && email.toLowerCase() === adminEmail);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role: isFirstOrSeededAdmin ? "ADMIN" : "MEMBER",
      },
      select: { id: true, email: true, name: true, role: true },
    });

    await setSessionCookie(signToken({ userId: user.id }));
    return ok({ user });
  });
}
