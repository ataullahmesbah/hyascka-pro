"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { authorize, canAccessConversation, canAccessTicket, toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";
import { messageSchema, ticketSchema, toActionState, type ActionState } from "@/lib/validation";
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

  const ticket = await prisma.supportTicket.create({
    data: {
      reference: reference("TKT"),
      clientId: user.clientProfileId,
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
