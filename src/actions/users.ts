"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/guards";
import { audit, securityEvent } from "@/lib/audit";
import { profileSchema, toActionState, userRoleSchema, userStatusSchema, type ActionState } from "@/lib/validation";

/**
 * Role and status changes are the highest-risk non-financial mutations in the
 * platform, so they are restricted to `roles.manage` (SUPER_ADMIN only by
 * default), guarded against privilege escalation, and always audited.
 */
export async function changeUserRoleAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const actor = await authorize("roles.manage");

  const parsed = userRoleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { userId, role } = parsed.data;

  if (userId === actor.id) {
    return { ok: false, message: "You cannot change your own role. Ask another Super Admin." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!target) return { ok: false, message: "That user no longer exists." };

  // The last Super Admin can never be demoted — that would lock everyone out.
  if (target.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    const remaining = await prisma.user.count({
      where: { role: "SUPER_ADMIN", status: "ACTIVE", id: { not: userId } },
    });
    if (remaining === 0) {
      return { ok: false, message: "This is the last active Super Admin. Promote someone else first." };
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });

  await audit({
    actorId: actor.id,
    actorRole: actor.role,
    action: "user.role_changed",
    entityType: "User",
    entityId: userId,
    summary: `${target.email} role changed ${target.role} → ${role}`,
  });
  await securityEvent({
    userId,
    email: target.email,
    type: "SUSPICIOUS",
    detail: `Role changed to ${role} by ${actor.email}`,
  });

  revalidatePath("/dashboard/users");
  return { ok: true, message: `${target.email} is now ${role.replace(/_/g, " ").toLowerCase()}.` };
}

/** Suspension is non-destructive: records are retained (PRD §9). */
export async function changeUserStatusAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const actor = await authorize("users.manage");

  const parsed = userStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { userId, status, reason } = parsed.data;

  if (userId === actor.id) {
    return { ok: false, message: "You cannot change your own account status." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, status: true, role: true },
  });
  if (!target) return { ok: false, message: "That user no longer exists." };
  if (target.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    return { ok: false, message: "Only a Super Admin can change another Super Admin's status." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status } }),
    // Suspending an account immediately ends its sessions.
    ...(status === "ACTIVE"
      ? []
      : [
          prisma.session.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
          }),
        ]),
  ]);

  await audit({
    actorId: actor.id,
    actorRole: actor.role,
    action: "user.status_changed",
    entityType: "User",
    entityId: userId,
    summary: `${target.email} status ${target.status} → ${status}`,
    metadata: { reason: reason || null },
  });

  revalidatePath("/dashboard/users");
  return { ok: true, message: `${target.email} is now ${status.toLowerCase().replace(/_/g, " ")}.` };
}

export async function updateProfileAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize();

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const input = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: { name: input.name, phone: input.phone || null },
  });

  if (user.clientProfileId) {
    await prisma.clientProfile.update({
      where: { id: user.clientProfileId },
      data: {
        companyName: input.companyName || null,
        billingEmail: input.billingEmail || null,
        billingPhone: input.billingPhone || null,
        addressLine1: input.addressLine1 || null,
        city: input.city || null,
        country: input.country || null,
        taxId: input.taxId || null,
      },
    });
  }

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "profile.updated",
    entityType: "User",
    entityId: user.id,
    summary: "Profile details updated",
  });

  revalidatePath("/dashboard/profile");
  return { ok: true, message: "Profile saved." };
}
