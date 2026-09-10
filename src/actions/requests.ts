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
import { reference } from "@/lib/utils";

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
  "CLOSED",
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

  /*
   * Closing is the last word. The final check happens before it, so once a
   * request is closed the client has nothing left to raise against it — they
   * open a new request instead. Staff keep writing, because the record of what
   * happened does not stop mattering when the work does.
   */
  if (context.request.closedAt && context.isOwner) {
    return {
      ok: false,
      message: "This work is closed. Start a new request if you need something else.",
    };
  }

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

  /*
   * Closing is its own decision, with its own preconditions and its own effect
   * on what the client may do. Letting the status dropdown move a request in
   * or out of CLOSED would route around all of that.
   */
  const current = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { closedAt: true },
  });
  if (!current) return { ok: false, message: "That request no longer exists." };
  if (current.closedAt) {
    return { ok: false, message: "This work is closed. Reopen it before changing its status." };
  }
  if (status === "CLOSED") {
    return { ok: false, message: "Use Sign-off to close this, so the client is told properly." };
  }

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
    select: {
      id: true,
      reference: true,
      title: true,
      clientId: true,
      status: true,
      confirmedAt: true,
      closedAt: true,
    },
  });
  if (!request || request.clientId !== user.clientProfileId) {
    return { ok: false, message: "That request is not available." };
  }
  if (request.status === "CANCELLED") {
    return { ok: false, message: "That request is already cancelled." };
  }

  /*
   * Cancelling belongs to the window before the order is confirmed. After that
   * the work is under way and has been paid for or invoiced, so it is not
   * something a client can undo on their own — they raise a ticket and we
   * settle it together. Leaving the option on let a delivered job be cancelled
   * from the portal, which is what this guard exists to stop.
   */
  if (request.closedAt) {
    return { ok: false, message: "This work is closed and can no longer be cancelled." };
  }
  if (
    request.confirmedAt ||
    ["CONVERTED", "IN_PROGRESS", "DELIVERED", "CLOSED"].includes(request.status)
  ) {
    return {
      ok: false,
      message:
        "This work is already under way. Raise a ticket about it and we will sort it out with you.",
    };
  }

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      cancelRequestedAt: new Date(),
      cancelReason: reason,
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  await prisma.serviceRequestUpdate.create({
    data: {
      requestId,
      authorId: user.id,
      kind: "CANCELLATION",
      body: `Request withdrawn by the client: ${reason}`,
    },
  });

  await notifyRoles(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"], {
    type: "REQUEST_UPDATED",
    title: `${request.reference}: withdrawn by the client`,
    body: reason.slice(0, 160),
    href: `/dashboard/requests/${request.id}`,
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "request.cancel",
    entityType: "ServiceRequest",
    entityId: requestId,
    summary: "Request withdrawn before the work was confirmed",
  });

  revalidatePath(`/dashboard/my-services/${requestId}`);
  revalidatePath(`/dashboard/requests/${requestId}`);
  return { ok: true, message: "That request has been withdrawn." };
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


/* ---------------------------------------------------------------------------
 * Quoting, and the client's decision
 *
 * The price is ours to set and theirs to accept. Neither side can do the
 * other's half: a client cannot alter an amount, and staff cannot accept on a
 * client's behalf. Confirming the work is a separate, deliberate step so the
 * team decides when a job actually starts (PRD v5.2 §3.4).
 * ------------------------------------------------------------------------- */

const quoteSchema = z.object({
  requestId: z.string().min(1),
  amount: z.coerce.number().positive("Enter an amount above zero.").max(100_000_000),
  currency: z.string().trim().length(3).default("USD"),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});

/** Staff put a price on a request. The client is told, and decides. */
export async function quoteRequestAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("clients.manage");
  const parsed = quoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { requestId, amount, currency, note } = parsed.data;

  const existing = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { id: true, reference: true, title: true, clientId: true, status: true, cancelledAt: true },
  });
  if (!existing) return { ok: false, message: "That request no longer exists." };
  if (existing.cancelledAt) return { ok: false, message: "That request has been cancelled." };

  const request = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      quotedAmount: amount,
      quoteCurrency: currency.toUpperCase(),
      quoteNote: note || null,
      quotedAt: new Date(),
      // A fresh quote reopens the decision, so an earlier answer cannot stand
      // against a price the client has not seen.
      acceptedAt: null,
      declinedAt: null,
      status: "OFFER_SENT",
      updates: {
        create: {
          authorId: user.id,
          kind: "STATUS",
          body: `Quoted ${amount.toFixed(2)} ${currency.toUpperCase()}${note ? ` — ${note}` : ""}`,
        },
      },
    },
    select: { id: true, reference: true, title: true, clientId: true },
  });

  await notifyCounterparty(
    request,
    true,
    `We have quoted ${amount.toFixed(2)} ${currency.toUpperCase()} for "${request.title}". Accept or decline in your portal.`,
  );

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "request.quoted",
    entityType: "ServiceRequest",
    entityId: request.id,
    summary: `${request.reference} quoted at ${amount.toFixed(2)} ${currency.toUpperCase()}`,
  });

  revalidatePath(`/dashboard/requests/${request.id}`);
  revalidatePath(`/dashboard/my-services/${request.id}`);
  return { ok: true, message: "Quote sent to the client." };
}

/** The client accepts or declines the price. Only the owner may answer. */
export async function respondToQuoteAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      requestId: z.string().min(1),
      decision: z.enum(["accept", "decline"]),
      note: z.string().trim().max(1000).optional().or(z.literal("")),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { requestId, decision, note } = parsed.data;

  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const loaded = await loadRequestFor(user.id, requestId);
  if (!loaded) return { ok: false, message: "That request is not available." };
  if (!loaded.isOwner) {
    return { ok: false, message: "Only the client this was quoted to can answer it." };
  }
  if (!loaded.request.quotedAt) return { ok: false, message: "There is no quote to answer yet." };
  if (loaded.request.cancelledAt) return { ok: false, message: "That request has been cancelled." };

  const accepted = decision === "accept";
  const request = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      acceptedAt: accepted ? new Date() : null,
      declinedAt: accepted ? null : new Date(),
      status: accepted ? "ACCEPTED" : "REJECTED",
      updates: {
        create: {
          authorId: user.id,
          kind: "STATUS",
          body: accepted
            ? `Client accepted the quote${note ? ` — ${note}` : ""}`
            : `Client declined the quote${note ? ` — ${note}` : ""}`,
        },
      },
    },
    select: { id: true, reference: true, title: true, clientId: true },
  });

  await notifyCounterparty(
    request,
    false,
    accepted ? "The client accepted the quote." : `The client declined the quote${note ? `: ${note}` : "."}`,
  );

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: accepted ? "request.quote_accepted" : "request.quote_declined",
    entityType: "ServiceRequest",
    entityId: request.id,
    summary: `${request.reference} ${accepted ? "accepted" : "declined"} by the client`,
  });

  revalidatePath(`/dashboard/my-services/${request.id}`);
  revalidatePath(`/dashboard/requests/${request.id}`);
  return {
    ok: true,
    message: accepted
      ? "Accepted. We will confirm and start the work."
      : "Declined. We will come back to you about it.",
  };
}

/** Staff confirm the work after the client accepted. This is what starts it. */
export async function confirmRequestAction(requestId: string): Promise<ActionState> {
  const user = await authorize("clients.manage");

  const existing = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { id: true, acceptedAt: true, confirmedAt: true, cancelledAt: true },
  });
  if (!existing) return { ok: false, message: "That request no longer exists." };
  if (existing.cancelledAt) return { ok: false, message: "That request has been cancelled." };
  if (!existing.acceptedAt) {
    return { ok: false, message: "The client has not accepted the quote yet." };
  }
  if (existing.confirmedAt) return { ok: false, message: "This is already confirmed." };

  const request = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      confirmedAt: new Date(),
      status: "IN_PROGRESS",
      updates: {
        create: { authorId: user.id, kind: "STATUS", body: "Order confirmed — work has started." },
      },
    },
    select: { id: true, reference: true, title: true, clientId: true },
  });

  await notifyCounterparty(request, true, `"${request.title}" is confirmed and under way.`);

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "request.confirmed",
    entityType: "ServiceRequest",
    entityId: request.id,
    summary: `${request.reference} confirmed`,
  });

  revalidatePath(`/dashboard/requests/${request.id}`);
  revalidatePath(`/dashboard/my-services/${request.id}`);
  return { ok: true, message: "Confirmed. The client can see the work has started." };
}

/**
 * A client asking us for something, from inside their portal.
 *
 * Either one of our catalogue services or work they describe themselves. This
 * is the path that was missing: previously a signed-in client had nowhere to
 * ask except the public contact form, which never reached their dashboard.
 */
export async function createClientRequestAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };
  if (user.role !== "CLIENT" || !user.clientProfileId) {
    return { ok: false, message: "Only client accounts can raise a request here." };
  }

  const parsed = z
    .object({
      serviceId: z.string().trim().max(40).optional().or(z.literal("")),
      title: z.string().trim().min(3, "Give it a short title.").max(160),
      brief: z.string().trim().min(20, "Tell us a little more — at least 20 characters.").max(4000),
      budget: z.string().trim().max(80).optional().or(z.literal("")),
      deadline: z.string().trim().max(40).optional().or(z.literal("")),
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
  const { serviceId, title, brief, budget, deadline, attachments } = parsed.data;

  // Only a published service id is accepted; anything else is custom work.
  const service = serviceId
    ? await prisma.service.findFirst({
        where: { id: serviceId, status: "PUBLISHED" },
        select: { id: true, title: true },
      })
    : null;

  const deadlineDate = deadline ? new Date(deadline) : null;

  const request = await prisma.serviceRequest.create({
    data: {
      reference: reference("REQ"),
      clientId: user.clientProfileId,
      serviceId: service?.id ?? null,
      title,
      brief,
      budget: budget || null,
      deadline: deadlineDate && !Number.isNaN(deadlineDate.getTime()) ? deadlineDate : null,
      isCustom: !service,
      status: "SUBMITTED",
      attachments: attachments.length ? attachments : undefined,
    },
    select: { id: true, reference: true, title: true, clientId: true },
  });

  await notifyRoles(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"], {
    type: "REQUEST_UPDATED",
    title: `${request.reference}: new request from a client`,
    body: `${service?.title ?? "Custom work"} — ${title}`,
    href: `/dashboard/requests/${request.id}`,
    telegram: true,
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "request.created",
    entityType: "ServiceRequest",
    entityId: request.id,
    summary: `${request.reference} raised by the client`,
    metadata: { service: service?.title ?? null, custom: !service },
  });

  revalidatePath("/dashboard/my-services");
  revalidatePath("/dashboard/requests");
  return {
    ok: true,
    message: `${request.reference} is with us. You can follow it here.`,
    data: { id: request.id },
  };
}


/* ---------------------------------------------------------------------------
 * Closing a piece of work
 *
 * Delivery is not the end of it — the final check with the client happens
 * between delivery and closing. Closing records that this happened, and from
 * that point the request is settled: the client raises nothing further against
 * it, and anything new is a new request. Staff can reopen, because a close
 * applied to the wrong request should not be a dead end.
 * ------------------------------------------------------------------------- */

export async function closeRequestAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorizeAny(["clients.manage", "projects.manage"]);

  const parsed = z
    .object({
      requestId: z.string().min(1),
      note: z.string().trim().max(2000).optional().or(z.literal("")),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { requestId, note } = parsed.data;

  const existing = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true, progress: true, closedAt: true, cancelledAt: true },
  });
  if (!existing) return { ok: false, message: "That request no longer exists." };
  if (existing.closedAt) return { ok: false, message: "This is already closed." };
  if (existing.cancelledAt) return { ok: false, message: "That request was cancelled." };

  // Closing says the work is finished and checked. Both must be true first, or
  // the status stops meaning anything to the client reading it.
  if (existing.progress < 100) {
    return { ok: false, message: "Set progress to 100% before closing this." };
  }
  if (!["DELIVERED", "CONVERTED"].includes(existing.status)) {
    return { ok: false, message: "Mark it delivered before closing it." };
  }

  const request = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      closedAt: new Date(),
      closeNote: note || null,
      status: "CLOSED",
      progress: 100,
      updates: {
        create: {
          authorId: user.id,
          kind: "STATUS",
          body: note
            ? `Closed — delivered and signed off. ${note}`
            : "Closed — delivered and signed off.",
        },
      },
    },
    select: { id: true, reference: true, title: true, clientId: true },
  });

  await notifyCounterparty(
    request,
    true,
    `"${request.title}" is complete and now closed. Thank you — open a new request any time.`,
  );

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "request.closed",
    entityType: "ServiceRequest",
    entityId: request.id,
    summary: `${request.reference} closed`,
  });

  revalidatePath(`/dashboard/requests/${request.id}`);
  revalidatePath(`/dashboard/my-services/${request.id}`);
  return { ok: true, message: `${request.reference} is closed.` };
}

export async function reopenRequestAction(requestId: string): Promise<ActionState> {
  const user = await authorizeAny(["clients.manage", "projects.manage"]);

  const existing = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { id: true, closedAt: true },
  });
  if (!existing) return { ok: false, message: "That request no longer exists." };
  if (!existing.closedAt) return { ok: false, message: "That request is not closed." };

  const request = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      closedAt: null,
      closeNote: null,
      status: "DELIVERED",
      updates: {
        create: { authorId: user.id, kind: "STATUS", body: "Reopened by the team." },
      },
    },
    select: { id: true, reference: true, title: true, clientId: true },
  });

  await notifyCounterparty(request, true, `"${request.title}" has been reopened.`);

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "request.reopened",
    entityType: "ServiceRequest",
    entityId: request.id,
    summary: `${request.reference} reopened`,
  });

  revalidatePath(`/dashboard/requests/${request.id}`);
  revalidatePath(`/dashboard/my-services/${request.id}`);
  return { ok: true, message: `${request.reference} is open again.` };
}
