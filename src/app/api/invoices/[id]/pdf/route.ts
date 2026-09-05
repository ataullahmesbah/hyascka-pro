import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { buildPdf } from "@/lib/reports/pdf";
import { formatCurrency, formatDate } from "@/lib/utils";

/**
 * The invoice, as a file a client can keep.
 *
 * Authorised per request rather than by obscurity: a client may download their
 * own invoices and nobody else's, and staff need the finance permission. The
 * id in the URL proves nothing on its own.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: { include: { service: { select: { title: true } } } },
      client: { select: { id: true, companyName: true, user: { select: { name: true, email: true } } } },
      payments: { where: { status: "VERIFIED" }, select: { amount: true } },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = user.role === "CLIENT" && user.clientProfileId === invoice.clientId;
  const isFinance = can(toActor(user), "finance.read");
  if (!isOwner && !isFinance) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const paid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const money = (value: number) => formatCurrency(value, invoice.currency);

  const pdf = buildPdf({
    title: `Invoice ${invoice.number}`,
    subtitle: invoice.client.companyName ?? invoice.client.user?.name ?? "Client",
    meta: [
      `Issued: ${invoice.issuedAt ? formatDate(invoice.issuedAt) : "—"}`,
      `Due: ${formatDate(invoice.dueDate)}`,
      `Status: ${invoice.status}`,
      `Billed to: ${invoice.client.user?.email ?? "—"}`,
    ],
    tables: [
      {
        title: "Items",
        headers: ["Service", "Description", "Qty", "Unit", "Total"],
        rows: invoice.items.map((item) => [
          item.service?.title ?? "—",
          item.description,
          String(item.quantity),
          money(Number(item.unitPrice)),
          money(Number(item.total)),
        ]),
      },
      {
        title: "Summary",
        headers: ["", "Amount"],
        rows: [
          ["Subtotal", money(Number(invoice.subtotal))],
          ["Tax", money(Number(invoice.tax))],
          ["Total", money(Number(invoice.total))],
          ["Paid", money(paid)],
          ["Outstanding", money(Number(invoice.total) - paid)],
        ],
      },
    ],
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
