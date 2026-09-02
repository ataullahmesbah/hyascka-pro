import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

/** The finance landing page is the role overview, so there is one KPI screen. */
export default async function FinanceIndexPage() {
  await requirePermission("finance.read");
  redirect("/dashboard/finance/invoices");
}
