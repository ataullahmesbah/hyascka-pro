import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can, type Permission } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { formatDate } from "@/lib/utils";

/**
 * CSV export (PRD §25). Authorisation is checked here exactly as it would be on
 * any other private route — an export URL is not a bypass.
 */
export const dynamic = "force-dynamic";

function toCsv(headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const permission: Permission = "reports.read";
  if (!can({ id: user.id, role: user.role, extraPermissions: user.extraPermissions, revokedPermissions: user.revokedPermissions }, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type") ?? "invoices";
  let csv: string;
  let filename: string;

  if (type === "payments") {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: {
        invoice: { select: { number: true, client: { select: { companyName: true } } } },
        verifiedBy: { select: { name: true } },
      },
    });
    csv = toCsv(
      ["Reference", "Invoice", "Client", "Method", "Amount", "Currency", "TrxID", "Status", "Decided by", "Created"],
      payments.map((payment) => [
        payment.reference,
        payment.invoice.number,
        payment.invoice.client.companyName ?? "",
        payment.method,
        Number(payment.amount),
        payment.currency,
        payment.trxId ?? "",
        payment.status,
        payment.verifiedBy?.name ?? "",
        formatDate(payment.createdAt, true),
      ]),
    );
    filename = "hyascka-payments.csv";
  } else if (type === "expenses") {
    const expenses = await prisma.expense.findMany({ orderBy: { spentAt: "desc" }, take: 5000 });
    csv = toCsv(
      ["Reference", "Category", "Vendor", "Description", "Amount", "Currency", "Status", "Date"],
      expenses.map((expense) => [
        expense.reference,
        expense.category,
        expense.vendor ?? "",
        expense.description ?? "",
        Number(expense.amount),
        expense.currency,
        expense.status,
        formatDate(expense.spentAt),
      ]),
    );
    filename = "hyascka-expenses.csv";
  } else {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: { client: { select: { companyName: true } } },
    });
    csv = toCsv(
      ["Number", "Client", "Status", "Issued", "Due", "Subtotal", "Tax", "Total", "Paid", "Currency"],
      invoices.map((invoice) => [
        invoice.number,
        invoice.client.companyName ?? "",
        invoice.status,
        formatDate(invoice.issueDate),
        formatDate(invoice.dueDate),
        Number(invoice.subtotal),
        Number(invoice.tax),
        Number(invoice.total),
        Number(invoice.amountPaid),
        invoice.currency,
      ]),
    );
    filename = "hyascka-invoices.csv";
  }

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "report.exported",
    entityType: "Report",
    entityId: type,
    summary: `${type} report exported as CSV`,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
