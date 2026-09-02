import { DashboardHeader } from "@/components/dashboard/page-shell";
import { InvoiceBuilder } from "@/components/dashboard/invoice-builder";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  await requirePermission("invoice.issue");

  const clients = await prisma.clientProfile.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true, user: { select: { name: true, email: true } } },
  });

  return (
    <>
      <DashboardHeader
        title="New invoice"
        description="Totals are calculated on the server from these line items — never from the browser."
        breadcrumbs={[{ label: "Invoices", href: "/dashboard/finance/invoices" }, { label: "New" }]}
      />
      <InvoiceBuilder
        clients={clients.map((client) => ({
          id: client.id,
          label: client.companyName ?? client.user.name,
          email: client.user.email,
        }))}
      />
    </>
  );
}
