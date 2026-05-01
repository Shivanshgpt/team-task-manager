import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminClient from "@/components/AdminClient";

export const metadata = { title: "Admin — Atelier" };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return <AdminClient users={JSON.parse(JSON.stringify(users))} currentUser={user} />;
}
