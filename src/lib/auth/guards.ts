import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { can, canAny, type Actor, type Permission } from "@/lib/rbac";
import { prisma } from "@/lib/db";

/** Thrown by guards used inside Server Actions and API routes. */
export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function toActor(user: CurrentUser): Actor {
  return {
    id: user.id,
    role: user.role,
    extraPermissions: user.extraPermissions,
    revokedPermissions: user.revokedPermissions,
  };
}

/** Page-level guard: redirects to login. Use in Server Components only. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(toActor(user), permission)) redirect("/dashboard?denied=1");
  return user;
}

export async function requireAnyPermission(permissions: Permission[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!canAny(toActor(user), permissions)) redirect("/dashboard?denied=1");
  return user;
}

/**
 * Action-level guard. Throws instead of redirecting, because a Server Action is
 * a public endpoint that may be called without any page around it (PRD §41.3).
 */
export async function authorize(permission?: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("You must be signed in.");
  if (permission && !can(toActor(user), permission)) throw new AuthorizationError();
  return user;
}

export async function authorizeAny(permissions: Permission[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("You must be signed in.");
  if (!canAny(toActor(user), permissions)) throw new AuthorizationError();
  return user;
}

// ---------------------------------------------------------------------------
// Ownership helpers (PRD §21, §41.4). An id in a request proves nothing —
// every one of these loads the record and checks it against the caller.
// ---------------------------------------------------------------------------

export async function canAccessClient(user: CurrentUser, clientId: string) {
  if (can(toActor(user), "clients.manage") || can(toActor(user), "finance.read")) return true;
  if (user.role === "CLIENT") return user.clientProfileId === clientId;
  if (user.role === "PROJECT_MANAGER") {
    const count = await prisma.project.count({
      where: { clientId, members: { some: { userId: user.id } } },
    });
    return count > 0;
  }
  return can(toActor(user), "clients.read");
}

export async function canAccessProject(user: CurrentUser, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { clientId: true, members: { select: { userId: true } } },
  });
  if (!project) return false;
  if (user.role === "CLIENT") return project.clientId === user.clientProfileId;
  if (user.role === "PROJECT_MANAGER") {
    return project.members.some((m) => m.userId === user.id) || can(toActor(user), "projects.manage");
  }
  return can(toActor(user), "projects.read");
}

export async function canAccessInvoice(user: CurrentUser, invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { clientId: true },
  });
  if (!invoice) return false;
  if (user.role === "CLIENT") return invoice.clientId === user.clientProfileId;
  return can(toActor(user), "finance.read");
}

export async function canAccessConversation(user: CurrentUser, conversationId: string) {
  const seat = await prisma.conversationParticipant.count({
    where: { conversationId, userId: user.id },
  });
  if (seat > 0) return true;
  // Staff with messaging permission may join any conversation; clients may not.
  return user.role !== "CLIENT" && can(toActor(user), "messages.manage");
}

export async function canAccessTicket(user: CurrentUser, ticketId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { clientId: true, assigneeId: true },
  });
  if (!ticket) return false;
  if (user.role === "CLIENT") return ticket.clientId === user.clientProfileId;
  return can(toActor(user), "support.read");
}

/** Scope filter applied to every client-facing list query. */
export function clientScope(user: CurrentUser) {
  return user.role === "CLIENT" ? { clientId: user.clientProfileId ?? "__none__" } : {};
}
