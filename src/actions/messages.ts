"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { authorize, canAccessConversation, canAccessTicket, toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";
import {
  messageSchema,
  staffTicketSchema,
  ticketAssignSchema,
  ticketSchema,
  toActionState,
  type ActionState,
} from "@/lib/validation";
import { reference } from "@/lib/utils";

export async function sendMessageAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize();

  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { conversationId, body, isInternalNote } = parsed.data;

  const limit = await rateLimit("message", user.id);
  if (!limit.success) return { ok: false, message: "You are sending messages very quickly. Pause for a moment." };

  // Membership is verified server-side; a conversation id proves nothing.
  if (!(await canAccessConversation(user, conversationId))) {
    return { ok: false, message: "You do not have access to that conversation." };
  }

  // Only staff may write internal notes, and clients never see them.
  const internal = Boolean(isInternalNote) && user.role !== "CLIENT" && can(toActor(user), "messages.manage");

  const message = await prisma.message.create({
    data: { conversationId, senderId: user.id, body, isInternalNote: internal },
    select: { id: true },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  if (!internal) {
    const others = await prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: user.id } },
      select: { userId: true },
    });
    await Promise.all(
      others.map((participant) =>
        notify({
          userId: participant.userId,
          type: "MESSAGE_RECEIVED",
          title: `New message from ${user.name}`,
          body: body.slice(0, 160),
          href: `/dashboard/messages/${conversationId}`,
        }),
      ),
    );
  }

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: internal ? "message.internal_note" : "message.sent",
    entityType: "Message",
    entityId: message.id,
    summary: `Message posted in conversation ${conversationId}`,
  });

  revalidatePath(`/dashboard/messages/${conversationId}`);
  return { ok: true, message: internal ? "Internal note added." : "Message sent." };
}

export async function markConversationRead(conversationId: string) {
  const user = await authorize();
  if (!(await canAccessConversation(user, conversationId))) return;
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: user.id },
    data: { lastReadAt: new Date() },
  });
}

export async function createTicketAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize();
  if (!user.clientProfileId) {
    return { ok: false, message: "Only client accounts can open a support ticket from here." };
  }

  const parsed = ticketSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);

  // A ticket may name the request it is about, but only one the caller owns —
  // an id in a form proves nothing.
  let requestId: string | null = null;
  if (parsed.data.requestId) {
    const owned = await prisma.serviceRequest.findFirst({
      where: { id: parsed.data.requestId, clientId: user.clientProfileId },
      select: { id: true },
    });
    requestId = owned?.id ?? null;
  }

  // Same rule for a project: it must be one of theirs.
  let projectId: string | null = null;
  if (parsed.data.projectId) {
    const owned = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, clientId: user.clientProfileId },
      select: { id: true },
    });
    projectId = owned?.id ?? null;
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      reference: reference("TKT"),
      clientId: user.clientProfileId,
      requestId,
      projectId,
      subject: parsed.data.subject,
      category: parsed.data.category,
      priority: parsed.data.priority,
      messages: { create: { authorId: user.id, body: parsed.data.body } },
    },
    select: { id: true, reference: true },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "ticket.created",
    entityType: "SupportTicket",
    entityId: ticket.id,
    summary: `Support ticket ${ticket.reference} opened`,
  });

  const staff = await prisma.user.findMany({
    where: { role: { in: ["SUPPORT", "ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
    select: { id: true },
  });
  await Promise.all(
    staff.map((member) =>
      notify({
        userId: member.id,
        type: "TICKET_UPDATED",
        title: `New ticket: ${parsed.data.subject}`,
        body: parsed.data.body.slice(0, 160),
        href: `/dashboard/support/${ticket.id}`,
      }),
    ),
  );

  revalidatePath("/dashboard/support");
  return { ok: true, message: `Ticket ${ticket.reference} opened. We will respond shortly.` };
}

export async function replyToTicketAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize();
  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const isInternal = formData.get("isInternal") === "on";

  if (!ticketId || body.length < 2) return { ok: false, message: "Write a reply first." };
  if (!(await canAccessTicket(user, ticketId))) {
    return { ok: false, message: "You do not have access to that ticket." };
  }

  const internal = isInternal && user.role !== "CLIENT" && can(toActor(user), "support.manage");

  await prisma.ticketMessage.create({
    data: { ticketId, authorId: user.id, body: body.slice(0, 4000), isInternal: internal },
  });
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: user.role === "CLIENT" ? "OPEN" : "PENDING" },
  });

  revalidatePath(`/dashboard/support/${ticketId}`);
  return { ok: true, message: internal ? "Internal note added." : "Reply sent." };
}

/**
 * Staff-raised ticket (PRD §6.4). Any staff role can open an internal token and
 * assign it, which is what lets the team track its own work rather than only
 * responding to clients.
 */
export async function createStaffTicketAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("support.manage");

  const parsed = staffTicketSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const input = parsed.data;

  // An internal token still needs a client row to hang from; fall back to the
  // first client so the ticket is never orphaned.
  const clientId =
    input.clientId ||
    (await prisma.clientProfile.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } }))?.id;

  if (!clientId) {
    return { ok: false, message: "Create a client account first — tickets are filed against one." };
  }

  if (input.assigneeId) {
    const assignee = await prisma.user.findUnique({
      where: { id: input.assigneeId },
      select: { role: true, status: true },
    });
    if (!assignee || assignee.role === "CLIENT" || assignee.status !== "ACTIVE") {
      return { ok: false, message: "Choose an active staff member to assign this to." };
    }
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      reference: reference("TKT"),
      clientId,
      subject: input.subject,
      category: input.category,
      priority: input.priority,
      assigneeId: input.assigneeId || null,
      messages: { create: { authorId: user.id, body: input.body, isInternal: !input.clientId } },
    },
    select: { id: true, reference: true },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "ticket.created_by_staff",
    entityType: "SupportTicket",
    entityId: ticket.id,
    summary: `Ticket ${ticket.reference} opened by ${user.name}`,
    metadata: { assigneeId: input.assigneeId || null },
  });

  if (input.assigneeId && input.assigneeId !== user.id) {
    await notify({
      userId: input.assigneeId,
      type: "TICKET_UPDATED",
      title: `Assigned to you: ${input.subject}`,
      body: input.body.slice(0, 160),
      href: `/dashboard/support/${ticket.id}`,
    });
  }

  revalidatePath("/dashboard/support");
  return { ok: true, message: `Ticket ${ticket.reference} created.` };
}

/**
 * Reassign a ticket to another staff member — the "I cannot solve this, pass it
 * on" path the team asked for (PRD §6.4).
 */
export async function assignTicketAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("support.manage");

  const parsed = ticketAssignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { ticketId, assigneeId } = parsed.data;

  if (!(await canAccessTicket(user, ticketId))) {
    return { ok: false, message: "You do not have access to that ticket." };
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { reference: true, subject: true, assignee: { select: { id: true, name: true } } },
  });
  if (!ticket) return { ok: false, message: "That ticket no longer exists." };

  let assigneeName = "Unassigned";
  if (assigneeId) {
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { name: true, role: true, status: true },
    });
    if (!assignee || assignee.role === "CLIENT" || assignee.status !== "ACTIVE") {
      return { ok: false, message: "Choose an active staff member." };
    }
    assigneeName = assignee.name;
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { assigneeId: assigneeId || null, status: "PENDING" },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId,
      authorId: user.id,
      isInternal: true,
      body: `Reassigned from ${ticket.assignee?.name ?? "Unassigned"} to ${assigneeName} by ${user.name}.`,
    },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "ticket.assigned",
    entityType: "SupportTicket",
    entityId: ticketId,
    summary: `Ticket ${ticket.reference} assigned to ${assigneeName}`,
    metadata: { from: ticket.assignee?.id ?? null, to: assigneeId || null },
  });

  if (assigneeId && assigneeId !== user.id) {
    await notify({
      userId: assigneeId,
      type: "TICKET_UPDATED",
      title: `Ticket assigned to you: ${ticket.subject}`,
      body: `${user.name} passed this to you. Reference ${ticket.reference}.`,
      href: `/dashboard/support/${ticketId}`,
    });
  }

  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath("/dashboard/support");
  return { ok: true, message: `Assigned to ${assigneeName}.` };
}

export async function setTicketStatusAction(ticketId: string, status: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED") {
  const user = await authorize("support.manage");
  if (!(await canAccessTicket(user, ticketId))) throw new Error("Not permitted.");

  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status } });
  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "ticket.status_changed",
    entityType: "SupportTicket",
    entityId: ticketId,
    summary: `Ticket status set to ${status}`,
  });
  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath("/dashboard/support");
}
