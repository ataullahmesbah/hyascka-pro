"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { authorize, canAccessProject } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import type { ActionState } from "@/lib/validation";

export async function updateProjectStatusAction(
  projectId: string,
  status: "PLANNING" | "IN_PROGRESS" | "REVIEW" | "ON_HOLD" | "COMPLETED" | "CANCELLED",
  progress: number,
): Promise<ActionState> {
  const user = await authorize("projects.manage");

  // Assignment is re-checked here: PROJECT_MANAGER is scoped to its own
  // projects, not to every project (PRD §42.5).
  if (!(await canAccessProject(user, projectId))) {
    return { ok: false, message: "You are not assigned to that project." };
  }

  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      status,
      progress: clamped,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
    select: { id: true, name: true, client: { select: { user: { select: { id: true } } } } },
  });

  await prisma.projectActivity.create({
    data: {
      projectId,
      actorId: user.id,
      action: "project.status",
      detail: `Status set to ${status} at ${clamped}% complete`,
    },
  });

  await notify({
    userId: project.client.user.id,
    type: "PROJECT_UPDATED",
    title: `${project.name} — status update`,
    body: `Your project is now ${status.replace(/_/g, " ").toLowerCase()} at ${clamped}% complete.`,
    href: `/dashboard/my-projects/${projectId}`,
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "project.status_changed",
    entityType: "Project",
    entityId: projectId,
    summary: `${project.name} → ${status} (${clamped}%)`,
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/projects");
  return { ok: true, message: "Project updated and the client notified." };
}

export async function updateTaskStatusAction(
  taskId: string,
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE",
) {
  const user = await authorize("projects.manage");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true, title: true },
  });
  if (!task) throw new Error("Task not found.");
  if (!(await canAccessProject(user, task.projectId))) throw new Error("Not permitted.");

  await prisma.task.update({ where: { id: taskId }, data: { status } });
  await prisma.projectActivity.create({
    data: {
      projectId: task.projectId,
      actorId: user.id,
      action: "task.status",
      detail: `"${task.title}" moved to ${status}`,
    },
  });

  revalidatePath(`/dashboard/projects/${task.projectId}`);
}

export async function addProjectNoteAction(projectId: string, detail: string) {
  const user = await authorize("projects.manage");
  if (!(await canAccessProject(user, projectId))) throw new Error("Not permitted.");

  await prisma.projectActivity.create({
    data: { projectId, actorId: user.id, action: "note", detail: detail.trim().slice(0, 1000) },
  });
  revalidatePath(`/dashboard/projects/${projectId}`);
}
