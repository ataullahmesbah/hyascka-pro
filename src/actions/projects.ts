"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { authorize, canAccessProject } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { toActionState, type ActionState } from "@/lib/validation";
import { reference, slugify } from "@/lib/utils";
import { attachmentsSchema } from "@/lib/attachments";
import { z } from "zod";

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


/**
 * Starting a project for a client.
 *
 * Until now a project could only come from the seed script, which meant a real
 * client's Projects page stayed empty forever. Staff create one here, and it is
 * visible in that client's portal the moment it exists.
 */
export async function createProjectAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("projects.manage");

  const parsed = z
    .object({
      clientId: z.string().min(1, "Choose a client."),
      requestId: z.string().trim().max(40).optional().or(z.literal("")),
      serviceId: z.string().trim().max(40).optional().or(z.literal("")),
      name: z.string().trim().min(3, "Give the project a name.").max(160),
      summary: z.string().trim().max(2000).optional().or(z.literal("")),
      dueDate: z.string().trim().max(40).optional().or(z.literal("")),
      budget: z.coerce.number().nonnegative().max(100_000_000).optional(),
      currency: z.string().trim().length(3).default("USD"),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const input = parsed.data;

  const client = await prisma.clientProfile.findUnique({
    where: { id: input.clientId },
    select: { id: true, userId: true },
  });
  if (!client) return { ok: false, message: "That client no longer exists." };

  // Ids from a form prove nothing: both must exist, and the request must belong
  // to the client the project is being created for.
  const request = input.requestId
    ? await prisma.serviceRequest.findFirst({
        where: { id: input.requestId, clientId: client.id },
        select: { id: true, reference: true },
      })
    : null;
  const service = input.serviceId
    ? await prisma.service.findUnique({ where: { id: input.serviceId }, select: { id: true } })
    : null;

  const due = input.dueDate ? new Date(input.dueDate) : null;
  const slugBase = slugify(input.name) || "project";

  const project = await prisma.project.create({
    data: {
      reference: reference("PRJ"),
      // The slug is unique across all projects, so it carries a suffix.
      slug: `${slugBase}-${Math.random().toString(36).slice(2, 7)}`,
      clientId: client.id,
      requestId: request?.id ?? null,
      serviceId: service?.id ?? null,
      name: input.name,
      summary: input.summary || null,
      status: "PLANNING",
      progress: 0,
      startDate: new Date(),
      dueDate: due && !Number.isNaN(due.getTime()) ? due : null,
      budget: input.budget ? input.budget : null,
      currency: input.currency.toUpperCase(),
    },
    select: { id: true, reference: true, name: true },
  });

  if (request) {
    await prisma.serviceRequest.update({
      where: { id: request.id },
      data: {
        status: "CONVERTED",
        updates: {
          create: {
            authorId: user.id,
            kind: "STATUS",
            body: `Converted to project ${project.reference}.`,
          },
        },
      },
    });
  }

  if (client.userId) {
    await notify({
      userId: client.userId,
      type: "PROJECT_UPDATED",
      title: `Project started — ${project.name}`,
      body: "You can follow its milestones and progress in your portal.",
      href: `/dashboard/my-projects/${project.id}`,
    });
  }

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "project.created",
    entityType: "Project",
    entityId: project.id,
    summary: `Project ${project.reference} created for a client`,
    metadata: { requestId: request?.id ?? null },
  });

  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/my-projects");
  return { ok: true, message: `${project.reference} created.`, data: { id: project.id } };
}

/**
 * Sharing a contract, proposal or any other file with a client.
 *
 * Same story as projects: there was no way to put a document in front of a
 * client, so their Documents page could only ever be empty.
 */
export async function shareClientDocumentAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("clients.manage");

  const parsed = z
    .object({
      clientId: z.string().min(1, "Choose a client."),
      title: z.string().trim().min(2, "Give the document a title.").max(160),
      category: z.enum(["CONTRACT", "PROPOSAL", "REPORT", "BRIEF", "OTHER"]).default("CONTRACT"),
      attachments: z
        .string()
        .optional()
        .transform((raw) => {
          if (!raw) return [];
          try {
            return JSON.parse(raw) as unknown;
          } catch {
            return [];
          }
        })
        .pipe(attachmentsSchema),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { clientId, title, category, attachments } = parsed.data;

  if (!attachments.length) return { ok: false, message: "Attach the file you want to share." };

  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    select: { id: true, userId: true },
  });
  if (!client) return { ok: false, message: "That client no longer exists." };

  await prisma.clientDocument.createMany({
    data: attachments.map((file, index) => ({
      clientId: client.id,
      title: attachments.length > 1 ? `${title} (${index + 1})` : title,
      category,
      url: file.url,
    })),
  });

  if (client.userId) {
    await notify({
      userId: client.userId,
      type: "DOCUMENT_SHARED",
      title: `New document — ${title}`,
      body: "It is in the Documents section of your portal.",
      href: "/dashboard/my-documents",
    });
  }

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "document.shared",
    entityType: "ClientProfile",
    entityId: client.id,
    summary: `Shared "${title}" with a client`,
    metadata: { count: attachments.length, category },
  });

  revalidatePath("/dashboard/my-documents");
  revalidatePath(`/dashboard/clients/${client.id}`);
  return { ok: true, message: `${attachments.length} file(s) shared.` };
}
