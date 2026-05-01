import { getSessionUser } from "@/lib/auth";
import { ok } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  return ok({ user });
}
