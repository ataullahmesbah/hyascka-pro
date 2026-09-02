import "server-only";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";

/**
 * Client-portal pages are for CLIENT accounts. Staff are redirected to their
 * own dashboard rather than shown an empty screen (PRD §42.1).
 */
export async function requireClient() {
  const user = await requireUser();
  if (user.role !== "CLIENT") redirect("/dashboard");
  if (!user.clientProfileId) redirect("/dashboard/profile");
  return { user, clientId: user.clientProfileId };
}
