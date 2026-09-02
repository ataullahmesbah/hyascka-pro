"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { authorize, canAccessClient, toActor } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import { leadUpdateSchema, toActionState, type ActionState } from "@/lib/validation";
import { notify } from "@/lib/notifications";

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

  const existing = await prisma.user.findUnique({ where: { email: lead.email }, select: { id: true } });
  if (existing) {
    return { ok: false, message: "An account already exists for that email address." };
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
