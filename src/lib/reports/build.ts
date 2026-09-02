import "server-only";

import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import type { Sheet } from "@/lib/reports/xlsx";
import type { PdfTable } from "@/lib/reports/pdf";

import {
  REPORT_LABELS,
  REPORT_PERIODS,
  REPORT_TYPES,
  type ReportPeriod,
  type ReportType,
} from "@/lib/reports/shared";

export { REPORT_LABELS, REPORT_PERIODS, REPORT_TYPES };
export type { ReportPeriod, ReportType };

export function periodStart(period: ReportPeriod) {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  if (period === "weekly") from.setDate(from.getDate() - 7);
  else if (period === "monthly") from.setMonth(from.getMonth() - 1);
  else if (period === "quarterly") from.setMonth(from.getMonth() - 3);
  return from;
}

export type ReportData = { title: string; subtitle: string; meta: string[]; tables: PdfTable[] };

/**
 * One report shape feeds both exporters (PRD §6.3), so the PDF and the
 * spreadsheet can never drift out of sync.
 */
export async function buildReport(type: ReportType, period: ReportPeriod): Promise<ReportData> {
  const from = periodStart(period);
  const range = `${formatDate(from)} – ${formatDate(new Date())}`;
  const meta = [`Period: ${period} (${range})`, `Generated: ${formatDate(new Date(), true)}`];

  if (type === "finance") {
    const [invoices, payments, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: { createdAt: { gte: from } },
        orderBy: { createdAt: "desc" },
        include: { client: { select: { companyName: true } } },
      }),
      prisma.payment.findMany({
        where: { createdAt: { gte: from } },
        orderBy: { createdAt: "desc" },
        include: { invoice: { select: { number: true, client: { select: { companyName: true } } } } },
      }),
      prisma.expense.findMany({ where: { spentAt: { gte: from } }, orderBy: { spentAt: "desc" } }),
    ]);

    const income = payments
      .filter((p) => p.status === "VERIFIED")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const spend = expenses
      .filter((e) => e.status === "APPROVED")
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      title: REPORT_LABELS.finance,
      subtitle: "Invoices issued, payments received and expenses approved",
      meta: [
        ...meta,
        `Verified income: ${income.toFixed(2)} · Approved expenses: ${spend.toFixed(2)} · Net: ${(income - spend).toFixed(2)}`,
      ],
      tables: [
        {
          title: `Invoices (${invoices.length})`,
          headers: ["Number", "Client", "Status", "Issued", "Due", "Total", "Paid", "Currency"],
          rows: invoices.map((invoice) => [
            invoice.number,
            invoice.client.companyName ?? "—",
            invoice.status,
            formatDate(invoice.issueDate),
            formatDate(invoice.dueDate),
            Number(invoice.total).toFixed(2),
            Number(invoice.amountPaid).toFixed(2),
            invoice.currency,
          ]),
        },
        {
          title: `Payments (${payments.length})`,
          headers: ["Reference", "Invoice", "Client", "Method", "Amount", "TrxID", "Status", "Date"],
          rows: payments.map((payment) => [
            payment.reference,
            payment.invoice.number,
            payment.invoice.client.companyName ?? "—",
            payment.method,
            Number(payment.amount).toFixed(2),
            payment.trxId ?? "—",
            payment.status,
            formatDate(payment.createdAt),
          ]),
        },
        {
          title: `Expenses (${expenses.length})`,
          headers: ["Reference", "Category", "Vendor", "Amount", "Status", "Date"],
          rows: expenses.map((expense) => [
            expense.reference,
            expense.category,
            expense.vendor ?? "—",
            Number(expense.amount).toFixed(2),
            expense.status,
            formatDate(expense.spentAt),
          ]),
        },
      ],
    };
  }

  if (type === "leads") {
    const leads = await prisma.lead.findMany({
      where: { createdAt: { gte: from } },
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { name: true } }, service: { select: { title: true } } },
    });
    const byStatus = leads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.status] = (acc[lead.status] ?? 0) + 1;
      return acc;
    }, {});

    return {
      title: REPORT_LABELS.leads,
      subtitle: "Every enquiry received in the period, with its pipeline stage",
      meta: [
        ...meta,
        `Total: ${leads.length} · ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(" · ") || "none"}`,
      ],
      tables: [
        {
          title: `Leads (${leads.length})`,
          headers: ["Reference", "Name", "Company", "Email", "Interest", "Budget", "Source", "Status", "Owner", "Received"],
          rows: leads.map((lead) => [
            lead.reference,
            lead.name,
            lead.company ?? "—",
            lead.email,
            lead.service?.title ?? "General",
            lead.budget ?? "—",
            lead.source,
            lead.status,
            lead.owner?.name ?? "Unassigned",
            formatDate(lead.createdAt),
          ]),
        },
      ],
    };
  }

  if (type === "projects") {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        client: { select: { companyName: true } },
        _count: { select: { tasks: true, milestones: true } },
      },
    });
    const tasks = await prisma.task.findMany({
      where: { updatedAt: { gte: from } },
      orderBy: { updatedAt: "desc" },
      include: { project: { select: { name: true } }, assignee: { select: { name: true } } },
      take: 400,
    });

    return {
      title: REPORT_LABELS.projects,
      subtitle: "Delivery status across every engagement",
      meta: [...meta, `Projects: ${projects.length} · Tasks touched: ${tasks.length}`],
      tables: [
        {
          title: `Projects (${projects.length})`,
          headers: ["Reference", "Project", "Client", "Status", "Progress", "Tasks", "Due"],
          rows: projects.map((project) => [
            project.reference,
            project.name,
            project.client.companyName ?? "—",
            project.status,
            `${project.progress}%`,
            String(project._count.tasks),
            formatDate(project.dueDate),
          ]),
        },
        {
          title: `Task activity (${tasks.length})`,
          headers: ["Project", "Task", "Status", "Priority", "Assignee", "Due"],
          rows: tasks.map((task) => [
            task.project.name,
            task.title,
            task.status,
            task.priority,
            task.assignee?.name ?? "Unassigned",
            formatDate(task.dueDate),
          ]),
        },
      ],
    };
  }

  const clients = await prisma.clientProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, status: true, lastLoginAt: true } },
      _count: { select: { projects: true, invoices: true, tickets: true } },
      invoices: {
        where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
        select: { total: true, amountPaid: true },
      },
    },
  });

  return {
    title: REPORT_LABELS.clients,
    subtitle: "Account list with engagement volume and outstanding balance",
    meta: [...meta, `Clients: ${clients.length}`],
    tables: [
      {
        title: `Clients (${clients.length})`,
        headers: ["Company", "Contact", "Email", "Status", "Projects", "Invoices", "Tickets", "Outstanding", "Since"],
        rows: clients.map((client) => [
          client.companyName ?? "—",
          client.user.name,
          client.user.email,
          client.user.status,
          String(client._count.projects),
          String(client._count.invoices),
          String(client._count.tickets),
          client.invoices
            .reduce((sum, invoice) => sum + Number(invoice.total) - Number(invoice.amountPaid), 0)
            .toFixed(2),
          formatDate(client.createdAt),
        ]),
      },
    ],
  };
}

export function toSheets(report: ReportData): Sheet[] {
  return report.tables.map((table) => ({
    name: table.title.replace(/\s*\(\d+\)$/, "").slice(0, 31),
    headers: table.headers,
    rows: table.rows.map((row) =>
      row.map((cell) => {
        // Numeric-looking cells become real numbers so Excel can total them.
        const numeric = Number(cell);
        return cell !== "" && cell !== "—" && Number.isFinite(numeric) && /^-?\d+(\.\d+)?$/.test(cell)
          ? numeric
          : cell;
      }),
    ),
  }));
}
