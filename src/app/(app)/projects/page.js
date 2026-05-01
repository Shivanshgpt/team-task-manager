import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProjectsClient from "@/components/ProjectsClient";

export const metadata = { title: "Projects — Atelier" };

export default async function ProjectsPage() {
  const user = await getSessionUser();
  const where =
    user.role === "ADMIN"
      ? {}
      : { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] };

  const [projects, users] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true, email: true } }),
  ]);

  return <ProjectsClient initialProjects={projects} users={users} currentUser={user} />;
}
