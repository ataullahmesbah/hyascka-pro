import "server-only";

import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth/session";

/**
 * Overview data per role (PRD §42). Every query is scoped by the caller's
 * identity — a CLIENT can only ever aggregate its own records, and a
 * PROJECT_MANAGER only the projects it is a member of.
 */

export async function staffOverview() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    newLeads,
    totalClients,
    activeProjects,
    openTickets,
    pendingPayments,
    overdueInvoices,
    monthRevenue,
    recentLeads,
    recentPayments,
    projectsDueSoon,
  ] = await Promise.all([
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.clientProfile.count(),
    prisma.project.count({ where: { status: { in: ["PLANNING", "IN_PROGRESS", "REVIEW"] } } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "PENDING"] } } }),
    prisma.payment.count({ where: { status: "PENDING_VERIFICATION" } }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
    prisma.payment.aggregate({
      where: { status: "VERIFIED", verifiedAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, reference: true, name: true, company: true, status: true, createdAt: true },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        reference: true,
        amount: true,
        currency: true,
        method: true,
        status: true,
        createdAt: true,
        invoice: { select: { number: true, client: { select: { companyName: true } } } },
      },
    }),
    prisma.project.findMany({
      where: { status: { in: ["PLANNING", "IN_PROGRESS", "REVIEW"] }, dueDate: { not: null } },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        dueDate: true,
        client: { select: { companyName: true } },
      },
    }),
  ]);

  return {
    newLeads,
    totalClients,
    activeProjects,
    openTickets,
    pendingPayments,
    overdueInvoices,
    monthRevenue: Number(monthRevenue._sum.amount ?? 0),
    recentLeads,
    recentPayments,
    projectsDueSoon,
  };
}

export async function financeOverview() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [income, expenses, receivable, overdue, pending, recentInvoices] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "VERIFIED", verifiedAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { status: "APPROVED", spentAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { total: true, amountPaid: true },
    }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
    prisma.payment.findMany({
      where: { status: "PENDING_VERIFICATION" },
      orderBy: { createdAt: "asc" },
      take: 6,
      select: {
        id: true,
        reference: true,
        amount: true,
        currency: true,
        method: true,
        trxId: true,
        createdAt: true,
        invoice: { select: { number: true, client: { select: { companyName: true } } } },
      },
    }),
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        amountPaid: true,
        currency: true,
        dueDate: true,
        client: { select: { companyName: true } },
      },
    }),
  ]);

  const receivableTotal = Number(receivable._sum.total ?? 0) - Number(receivable._sum.amountPaid ?? 0);

  return {
    monthIncome: Number(income._sum.amount ?? 0),
    monthExpenses: Number(expenses._sum.amount ?? 0),
    receivable: receivableTotal,
    overdueCount: overdue,
    pendingPayments: pending,
    recentInvoices,
  };
}

export async function clientOverview(clientProfileId: string) {
  const [projects, invoices, unpaid, tickets, messages, recentProjects, recentInvoices] =
    await Promise.all([
      prisma.project.count({ where: { clientId: clientProfileId } }),
      prisma.invoice.count({ where: { clientId: clientProfileId } }),
      prisma.invoice.aggregate({
        where: {
          clientId: clientProfileId,
          status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
        },
        _sum: { total: true, amountPaid: true },
      }),
      prisma.supportTicket.count({
        where: { clientId: clientProfileId, status: { in: ["OPEN", "PENDING"] } },
      }),
      prisma.conversation.count({ where: { participants: { some: {} }, clientUserId: undefined } }),
      prisma.project.findMany({
        where: { clientId: clientProfileId },
        orderBy: { updatedAt: "desc" },
        take: 4,
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
          dueDate: true,
          milestones: { select: { title: true, status: true }, orderBy: { position: "asc" } },
        },
      }),
      prisma.invoice.findMany({
        where: { clientId: clientProfileId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          amountPaid: true,
          currency: true,
          dueDate: true,
        },
      }),
    ]);

  return {
    projectCount: projects,
    invoiceCount: invoices,
    outstanding: Number(unpaid._sum.total ?? 0) - Number(unpaid._sum.amountPaid ?? 0),
    openTickets: tickets,
    conversations: messages,
    recentProjects,
    recentInvoices,
  };
}

export async function projectManagerOverview(userId: string) {
  const where = { members: { some: { userId } } };
  const [active, overdueTasks, myTasks, projects] = await Promise.all([
    prisma.project.count({ where: { ...where, status: { in: ["PLANNING", "IN_PROGRESS", "REVIEW"] } } }),
    prisma.task.count({
      where: { assigneeId: userId, status: { not: "DONE" }, dueDate: { lt: new Date() } },
    }),
    prisma.task.findMany({
      where: { assigneeId: userId, status: { not: "DONE" } },
      orderBy: { dueDate: "asc" },
      take: 6,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.project.findMany({
      where,
      orderBy: { dueDate: "asc" },
      take: 6,
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        dueDate: true,
        client: { select: { companyName: true } },
      },
    }),
  ]);

  return { active, overdueTasks, myTasks, projects };
}

export async function editorOverview() {
  const [published, drafts, posts, services, recentPosts] = await Promise.all([
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
    prisma.blogPost.count({ where: { status: "DRAFT" } }),
    prisma.blogPost.count(),
    prisma.service.count(),
    prisma.blogPost.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, title: true, slug: true, status: true, updatedAt: true },
    }),
  ]);
  return { published, drafts, posts, services, recentPosts };
}

export async function supportOverview(userId: string) {
  const [open, mine, unanswered, tickets] = await Promise.all([
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "PENDING"] } } }),
    prisma.supportTicket.count({ where: { assigneeId: userId, status: { in: ["OPEN", "PENDING"] } } }),
    prisma.conversation.count({ where: { isArchived: false } }),
    prisma.supportTicket.findMany({
      where: { status: { in: ["OPEN", "PENDING"] } },
      orderBy: { createdAt: "asc" },
      take: 6,
      select: {
        id: true,
        reference: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
        client: { select: { companyName: true } },
      },
    }),
  ]);
  return { open, mine, unanswered, tickets };
}

/** Conversations the caller is allowed to see, newest activity first. */
export async function conversationsFor(user: CurrentUser) {
  return prisma.conversation.findMany({
    where:
      user.role === "CLIENT"
        ? { participants: { some: { userId: user.id } } }
        : { OR: [{ participants: { some: { userId: user.id } } }, { isArchived: false }] },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      lastMessageAt: true,
      participants: { select: { userId: true, user: { select: { name: true } } } },
      messages: {
        where: user.role === "CLIENT" ? { isInternalNote: false } : {},
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
    },
  });
}
