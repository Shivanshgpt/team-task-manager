import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProjectDetailClient from "@/components/ProjectDetailClient";

export const metadata = { title: "Project — Atelier" };

export default async function ProjectDetail({ params }) {
  const { id } = await params;
  const user = await getSessionUser();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!project) notFound();
  const isMember = project.members.some((m) => m.userId === user.id);
  if (user.role !== "ADMIN" && project.ownerId !== user.id && !isMember) redirect("/projects");

  const allUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
  const isOwnerOrAdmin = user.role === "ADMIN" || project.ownerId === user.id;

  return (
    <ProjectDetailClient
      project={JSON.parse(JSON.stringify(project))}
      allUsers={allUsers}
      currentUser={user}
      isOwnerOrAdmin={isOwnerOrAdmin}
    />
  );
}
