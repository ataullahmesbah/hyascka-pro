"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { audit } from "@/lib/audit";
import { authorize, authorizeAny } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notify, notifyRoles } from "@/lib/notifications";
import { attachmentsSchema } from "@/lib/attachments";
import { toActionState, type ActionState } from "@/lib/validation";

/**
 * The shared timeline on a service request (PRD v5.2 §3).
 *
 * Staff and the owning client write to the same thread, so "what did we agree"
 * has one answer rather than an email chain on one side and a note on the
 * other. Every write re-checks who is asking and that the request is theirs —
 * an id in a form proves nothing.
 */

const STAFF_STATUSES = [
  "SUBMITTED",
  "IN_REVIEW",
  "OFFER_SENT",
  "ACCEPTED",
  "REJECTED",
  "CONVERTED",
  "IN_PROGRESS",
  "DELIVERED",
  "CANCELLED",
] as const;

const updateSchema = z.object({
  requestId: z.string().min(1),
  body: z.string().trim().min(2, "Write something first.").max(4000),
  internal: z.coerce.boolean().default(false),
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
});

const statusSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(STAFF_STATUSES),
  progress: z.coerce.number().int().min(0).max(100),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});

const cancelSchema = z.object({
  requestId: z.string().min(1),
  reason: z.string().trim().min(5, "Tell us why, so we can help.").max(1000),
});

/** Loads a request the caller is actually allowed to see. */
async function loadRequestFor(userId: string, requestId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: {
      client: { select: { id: true, companyName: true, userId: true } },
      service: { select: { title: true } },
    },
  });
  if (!request) return null;

  const isOwner = user.role === "CLIENT" && user.clientProfileId === request.clientId;
  const isStaff = user.role !== "CLIENT";
  if (!isOwner && !isStaff) return null;

  return { request, user, isOwner, isStaff };
}

/** Notifies whichever side did not write the update. */
async function notifyCounterparty(
  request: { id: string; reference: string; title: string; clientId: string },
  authorIsStaff: boolean,
  summary: string,
) {
  if (authorIsStaff) {
    const client = await prisma.clientProfile.findUnique({
      where: { id: request.clientId },
      select: { userId: true },
    });
    if (!client?.userId) return;
    await notify({
      userId: client.userId,
      type: "REQUEST_UPDATED",
      title: `Update on ${request.title}`,
      body: summary,
      href: `/dashboard/my-services/${request.id}`,
    });
    return;
  }

  await notifyRoles(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"], {
    type: "REQUEST_UPDATED",
    title: `${request.reference}: client replied`,
    body: summary,
    href: `/dashboard/requests/${request.id}`,
  });
}

export async function postRequestUpdateAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { requestId, body, internal, attachments } = parsed.data;

  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const context = await loadRequestFor(user.id, requestId);
  if (!context) return { ok: false, message: "That request is not available." };

  // Only staff can leave a note the client will never see.
  const isInternal = internal && context.isStaff;

  await prisma.serviceRequestUpdate.create({
    data: {
      requestId,
      authorId: user.id,
      body,
      kind: "NOTE",
      internal: isInternal,
      attachments: attachments.length ? attachments : undefined,
    },
  });

  await prisma.serviceRequest.update({ where: { id: requestId }, data: { updatedAt: new Date() } });

  if (!isInternal) {
    await notifyCounterparty(context.request, context.isStaff, body.slice(0, 160));
  }

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "request.updated",
    entityType: "ServiceRequest",
    entityId: requestId,
    summary: `Message on ${context.request.reference}`,
  });

  revalidatePath(`/dashboard/requests/${requestId}`);
  revalidatePath(`/dashboard/my-services/${requestId}`);
  return { ok: true, message: isInternal ? "Internal note saved." : "Message sent." };
}

export async function setRequestStatusAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorizeAny(["clients.manage", "projects.manage"]);

  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { requestId, status, progress, note } = parsed.data;

  const request = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      status,
      progress,
      ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
    },
    select: { id: true, reference: true, title: true, clientId: true },
  });

  await prisma.serviceRequestUpdate.create({
    data: {
      requestId,
      authorId: user.id,
      kind: "STATUS",
      body: note?.trim()
        ? `Status set to ${status.toLowerCase().replace(/_/g, " ")} (${progress}%). ${note.trim()}`
        : `Status set to ${status.toLowerCase().replace(/_/g, " ")} (${progress}% complete).`,
    },
  });

  await notifyCounterparty(request, true, `Now ${status.toLowerCase().replace(/_/g, " ")} — ${progress}% complete.`);

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "request.status",
    entityType: "ServiceRequest",
    entityId: requestId,
    summary: `${request.reference} → ${status}`,
  });

  revalidatePath(`/dashboard/requests/${requestId}`);
  revalidatePath(`/dashboard/my-services/${requestId}`);
  return { ok: true, message: "Status updated. The client has been notified." };
}

/**
 * A client withdrawing a request.
 *
 * Before an order exists this is simply a cancellation. Once one does, work and
 * money are committed, so it becomes a request that staff decide on — which is
 * what the two timestamps on the model distinguish.
 */
export async function requestCancellationAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = cancelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { requestId, reason } = parsed.data;

  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") return { ok: false, message: "Not available." };

  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { id: true, reference: true, title: true, clientId: true, status: true },
  });
  if (!request || request.clientId !== user.clientProfileId) {
    return { ok: false, message: "That request is not available." };
  }
  if (request.status === "CANCELLED") {
    return { ok: false, message: "That request is already cancelled." };
  }

  const orders = await prisma.order.count({
    where: { clientId: request.clientId, status: { in: ["ACTIVE", "COMPLETED"] } },
  });
  const confirmed = orders > 0 || request.status === "CONVERTED";

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      cancelRequestedAt: new Date(),
      cancelReason: reason,
      ...(confirmed ? {} : { status: "CANCELLED", cancelledAt: new Date() }),
    },
  });

  await prisma.serviceRequestUpdate.create({
    data: {
      requestId,
      authorId: user.id,
      kind: "CANCELLATION",
      body: confirmed
        ? `Cancellation requested: ${reason}`
        : `Request withdrawn by the client: ${reason}`,
    },
  });

  await notifyRoles(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"], {
    type: "REQUEST_UPDATED",
    title: confirmed
      ? `${request.reference}: cancellation requested`
      : `${request.reference}: withdrawn by the client`,
    body: reason.slice(0, 160),
    href: `/dashboard/requests/${request.id}`,
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "request.cancel",
    entityType: "ServiceRequest",
    entityId: requestId,
    summary: confirmed ? "Cancellation requested" : "Request withdrawn",
  });

  revalidatePath(`/dashboard/my-services/${requestId}`);
  revalidatePath(`/dashboard/requests/${requestId}`);
  return {
    ok: true,
    message: confirmed
      ? "We have your cancellation request — someone will come back to you."
      : "That request has been withdrawn.",
  };
}

/** Staff creating a bespoke request against a client, so it lands in their portal. */
export async function createCustomRequestAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("clients.manage");

  const parsed = z
    .object({
      clientId: z.string().min(1, "Choose a client."),
      title: z.string().trim().min(3).max(160),
      brief: z.string().trim().min(10, "Describe what is being delivered.").max(4000),
      budget: z.string().trim().max(80).optional().or(z.literal("")),
      serviceId: z.string().optional().or(z.literal("")),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { clientId, title, brief, budget, serviceId } = parsed.data;

  const count = await prisma.serviceRequest.count();
  const request = await prisma.serviceRequest.create({
    data: {
      reference: `REQ-${String(count + 1).padStart(4, "0")}`,
      clientId,
      title,
      brief,
      budget: budget || null,
      serviceId: serviceId || null,
      status: "IN_REVIEW",
    },
    select: { id: true, reference: true, title: true, clientId: true },
  });

  await notifyCounterparty(request, true, `We have set up "${title}" for you.`);

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "request.created",
    entityType: "ServiceRequest",
    entityId: request.id,
    summary: `Custom request ${request.reference} for a client`,
  });

  revalidatePath("/dashboard/requests");
  return { ok: true, message: `${request.reference} created and shared with the client.`, data: { id: request.id } };
}
