import "server-only";

import { prisma, isDatabaseConfigured } from "@/lib/db";
import { requestContext } from "@/lib/auth/session";

/**
 * Append-oriented audit trail (PRD §26, §41.6). Every sensitive mutation is
 * recorded regardless of whether it came from an API route or a Server Action.
 * Auditing must never break the operation it records, so failures are logged
 * rather than thrown.
 */
export type AuditInput = {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function audit(input: AuditInput) {
  if (!isDatabaseConfigured()) return;
  try {
    const { ipAddress } = await requestContext();
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary,
        metadata: (input.metadata ?? {}) as object,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit entry:", error);
  }
}

export async function securityEvent(input: {
  userId?: string | null;
  email?: string | null;
  type: "LOGIN_FAILED" | "LOGIN_SUCCESS" | "RATE_LIMITED" | "PASSWORD_RESET" | "SUSPICIOUS" | "PERMISSION_DENIED";
  detail?: string;
}) {
  if (!isDatabaseConfigured()) return;
  try {
    const { ipAddress, userAgent } = await requestContext();
    await prisma.securityEvent.create({
      data: {
        userId: input.userId ?? null,
        email: input.email ?? null,
        type: input.type,
        detail: input.detail ?? null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write security event:", error);
  }
}
