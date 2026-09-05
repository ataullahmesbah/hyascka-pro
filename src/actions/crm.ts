"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { authorize, canAccessClient, toActor } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import { leadReplySchema, leadUpdateSchema, toActionState, type ActionState } from "@/lib/validation";
import { emailLayout, sendEmail } from "@/lib/providers/email";
import { getSettings } from "@/lib/settings";
import { notify } from "@/lib/notifications";
import { reference } from "@/lib/utils";

/**
 * Every action below starts with authentication, then a permission check, then
 * schema validation, and only then touches the database (PRD §41.3).
 */

export async function updateLeadAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("leads.manage");

  const parsed = leadUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { leadId, status, ownerId, note } = parsed.data;

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, status: true, name: true } });
  if (!lead) return { ok: false, message: "That lead no longer exists." };

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status,
      ownerId: ownerId || null,
      convertedAt: status === "WON" ? new Date() : null,
    },
  });

  if (note) {
    await prisma.leadNote.create({ data: { leadId, authorId: user.id, body: note } });
  }

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "lead.updated",
    entityType: "Lead",
    entityId: leadId,
    summary: `Lead ${lead.name} moved ${lead.status} → ${status}`,
    metadata: { ownerId: ownerId || null },
  });

  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${leadId}`);
  return { ok: true, message: "Lead updated." };
}

export async function addLeadNoteAction(leadId: string, body: string) {
  const user = await authorize("leads.manage");
  const trimmed = body.trim().slice(0, 2000);
  if (!trimmed) return;

  await prisma.leadNote.create({ data: { leadId, authorId: user.id, body: trimmed } });
  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "lead.note_added",
    entityType: "Lead",
    entityId: leadId,
    summary: "Note added to lead",
  });
  revalidatePath(`/dashboard/leads/${leadId}`);
}

/** Converts a qualified lead into a client account with a portal login. */
export async function convertLeadAction(leadId: string): Promise<ActionState> {
  const user = await authorize("clients.manage");

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { ok: false, message: "That lead no longer exists." };

  /**
   * An enquiry from someone who already has an account used to dead-end here.
   * It should not: attach the enquiry to their portal as a service request, so
   * the work is visible to them instead of living only in this lead.
   */
  const existing = await prisma.user.findUnique({
    where: { email: lead.email },
    select: { id: true, clientProfile: { select: { id: true } } },
  });
  if (existing) {
    if (!existing.clientProfile) {
      return { ok: false, message: "That email belongs to a staff account, so it cannot be a client." };
    }
    if (lead.requestId) {
      return { ok: false, message: "This enquiry is already in that client's portal." };
    }

    const request = await prisma.serviceRequest.create({
      data: {
        reference: reference("REQ"),
        clientId: existing.clientProfile.id,
        serviceId: lead.serviceId,
        title: lead.company ? `${lead.company} — enquiry` : "New enquiry",
        brief: lead.message,
        budget: lead.budget,
        isCustom: !lead.serviceId,
        status: "IN_REVIEW",
      },
      select: { id: true, reference: true },
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: { clientId: existing.clientProfile.id, requestId: request.id, status: "QUALIFIED" },
    });

    await notify({
      userId: existing.id,
      type: "REQUEST_UPDATED",
      title: `Your enquiry is in your portal — ${request.reference}`,
      body: "You can follow its status, send us files and message us about it there.",
      href: `/dashboard/my-services/${request.id}`,
    });

    await audit({
      actorId: user.id,
      actorRole: user.role,
      action: "lead.attached",
      entityType: "Lead",
      entityId: leadId,
      summary: `Enquiry ${lead.reference} attached to an existing client portal`,
      metadata: { requestId: request.id },
    });

    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard/requests");
    return { ok: true, message: `Added to their portal as ${request.reference}.` };
  }

  // A random, unusable password: the client sets their own via password reset.
  const { hashPassword } = await import("@/lib/auth/password");
  const passwordHash = await hashPassword(`${crypto.randomUUID()}${crypto.randomUUID()}`);

  const created = await prisma.user.create({
    data: {
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      passwordHash,
      role: "CLIENT",
      status: "ACTIVE",
      clientProfile: {
        create: {
          companyName: lead.company,
          billingEmail: lead.email,
          referralCode: `HY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        },
      },
    },
    select: { id: true, clientProfile: { select: { id: true } } },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "WON", convertedAt: new Date() },
  });

  await notify({
    userId: created.id,
    type: "CLIENT_CREATED",
    title: "Your HYASCKA client portal is ready",
    body: "Use “Forgot password” on the login page to set your password and access your portal.",
    href: "/dashboard",
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "lead.converted",
    entityType: "Lead",
    entityId: leadId,
    summary: `Lead ${lead.name} converted to a client account`,
    metadata: { userId: created.id },
  });

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/clients");
  return { ok: true, message: "Client account created. They can set a password via the reset link." };
}

/**
 * Reply to an enquiry from the dashboard (PRD §7.1). The email goes out through
 * the same adapter as everything else, and the reply is recorded on the lead so
 * the thread survives staff changes.
 */
export async function replyToLeadAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("leads.manage");

  const parsed = leadReplySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { leadId, subject, body } = parsed.data;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, name: true, email: true, reference: true, status: true },
  });
  if (!lead) return { ok: false, message: "That lead no longer exists." };

  const settings = await getSettings();
  const safeBody = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");

  const result = await sendEmail({
    to: lead.email,
    replyTo: settings.contact.email,
    subject,
    html: emailLayout(
      `Re: your enquiry ${lead.reference}`,
      `<p>${safeBody}</p>
       <p style="color:#8a93ae;font-size:13px;margin-top:20px">— ${user.name}, ${settings.brand.siteName}</p>`,
    ),
    text: body,
  });

  // The note is written whether or not the email left, so the thread is honest
  // about what happened.
  await prisma.leadNote.create({
    data: {
      leadId,
      authorId: user.id,
      body: result.ok
        ? `Replied by email — "${subject}"\n\n${body}`
        : `Reply FAILED to send ("${subject}"). Error: ${result.error}\n\n${body}`,
    },
  });

  if (lead.status === "NEW") {
    await prisma.lead.update({ where: { id: leadId }, data: { status: "CONTACTED" } });
  }

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "lead.replied",
    entityType: "Lead",
    entityId: leadId,
    summary: `Reply sent to ${lead.email} for ${lead.reference}`,
    metadata: { delivered: result.ok },
  });

  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard/leads");

  return result.ok
    ? { ok: true, message: `Reply sent to ${lead.email}.` }
    : {
        ok: false,
        message: `Saved to the thread, but the email did not send: ${result.error}. Check the Resend settings.`,
      };
}

export async function updateClientNotesAction(clientId: string, notes: string) {
  const user = await authorize("clients.manage");
  if (!(await canAccessClient(user, clientId))) throw new Error("Not permitted.");

  await prisma.clientProfile.update({
    where: { id: clientId },
    data: { notes: notes.trim().slice(0, 4000) },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "client.notes_updated",
    entityType: "ClientProfile",
    entityId: clientId,
    summary: "Client notes updated",
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
}

export async function assertCanSeeClient(userId: string, clientId: string) {
  const user = await authorize("clients.read");
  if (user.id !== userId && !can(toActor(user), "clients.read")) throw new Error("Not permitted.");
  return canAccessClient(user, clientId);
}
