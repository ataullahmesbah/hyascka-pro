"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { authorize, canAccessInvoice } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { notify, notifyRoles } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { newEventId, sendConversionEvent } from "@/lib/tracking";
import { reference } from "@/lib/utils";
import {
  expenseSchema,
  invoiceSchema,
  paymentDecisionSchema,
  paymentSubmissionSchema,
  toActionState,
  type ActionState,
} from "@/lib/validation";

/**
 * Finance is the highest-risk surface in the platform. Every action here:
 *   · checks a dedicated finance permission (never just "is signed in")
 *   · re-reads amounts and ownership from the database, never from the client
 *   · runs multi-record changes inside a transaction
 *   · writes an audit entry
 *   · reverses rather than deletes (PRD §13, §37, §41.6, §43.3)
 */

export async function createInvoiceAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("invoice.issue");

  const raw = {
    clientId: formData.get("clientId"),
    dueDate: formData.get("dueDate"),
    currency: formData.get("currency") || "BDT",
    notes: formData.get("notes") ?? "",
    items: JSON.parse(String(formData.get("items") ?? "[]")),
  };

  const parsed = invoiceSchema.safeParse(raw);
  if (!parsed.success) return toActionState(parsed.error);
  const input = parsed.data;

  const client = await prisma.clientProfile.findUnique({
    where: { id: input.clientId },
    select: { id: true, user: { select: { id: true, name: true } } },
  });
  if (!client) return { ok: false, message: "That client no longer exists." };

  // A line may name one of our services. Only ids that really exist are stored,
  // so a tampered form cannot point an invoice line at an arbitrary record.
  const requestedServiceIds = [...new Set(input.items.map((item) => item.serviceId).filter(Boolean))] as string[];
  const knownServiceIds = new Set(
    requestedServiceIds.length
      ? (
          await prisma.service.findMany({
            where: { id: { in: requestedServiceIds } },
            select: { id: true },
          })
        ).map((service) => service.id)
      : [],
  );

  // Totals are computed server-side. A price submitted by the browser is never
  // trusted (PRD §20).
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  const items = input.items.map((item) => {
    const gross = item.quantity * item.unitPrice;
    const net = Math.max(0, gross - item.discount);
    const tax = (net * item.taxRate) / 100;
    subtotal += gross;
    discountTotal += item.discount;
    taxTotal += tax;
    return {
      serviceId: item.serviceId && knownServiceIds.has(item.serviceId) ? item.serviceId : null,
      description: item.description,
      quantity: item.quantity,
      unitPrice: new Prisma.Decimal(item.unitPrice),
      discount: new Prisma.Decimal(item.discount),
      taxRate: new Prisma.Decimal(item.taxRate),
      total: new Prisma.Decimal(net + tax),
    };
  });
  const total = subtotal - discountTotal + taxTotal;

  const invoice = await prisma.invoice.create({
    data: {
      number: reference("INV"),
      clientId: input.clientId,
      status: "ISSUED",
      issuedAt: new Date(),
      dueDate: new Date(input.dueDate),
      subtotal: new Prisma.Decimal(subtotal),
      discount: new Prisma.Decimal(discountTotal),
      tax: new Prisma.Decimal(taxTotal),
      total: new Prisma.Decimal(total),
      currency: input.currency,
      notes: input.notes || null,
      items: { create: items },
    },
    select: { id: true, number: true },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "invoice.issued",
    entityType: "Invoice",
    entityId: invoice.id,
    summary: `Invoice ${invoice.number} issued for ${total.toFixed(2)} ${input.currency}`,
    metadata: { clientId: input.clientId, itemCount: items.length },
  });

  await notify({
    userId: client.user.id,
    type: "INVOICE_ISSUED",
    title: `New invoice ${invoice.number}`,
    body: `An invoice for ${total.toFixed(2)} ${input.currency} is ready, due ${new Date(input.dueDate).toDateString()}.`,
    href: `/dashboard/my-invoices/${invoice.id}`,
  });

  revalidatePath("/dashboard/finance/invoices");
  return { ok: true, message: `Invoice ${invoice.number} issued.`, data: { id: invoice.id } };
}

/** Void, never delete — financial history stays auditable (PRD §13, §37). */
export async function voidInvoiceAction(invoiceId: string, reason: string) {
  const user = await authorize("finance.approve");

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, number: true, status: true, amountPaid: true },
  });
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status === "PAID" || Number(invoice.amountPaid) > 0) {
    throw new Error("A paid invoice cannot be voided. Raise a refund or an adjustment instead.");
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "VOID", voidedAt: new Date(), voidReason: reason.slice(0, 300) },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "invoice.voided",
    entityType: "Invoice",
    entityId: invoiceId,
    summary: `Invoice ${invoice.number} voided`,
    metadata: { reason },
  });

  revalidatePath("/dashboard/finance/invoices");
  revalidatePath(`/dashboard/finance/invoices/${invoiceId}`);
}

/**
 * Client-side manual payment submission (PRD §43.2). The amount is checked
 * against the invoice, the method must be active, and the transaction id is
 * globally unique so the same reference cannot be reused (§43.3).
 */
export async function submitPaymentAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize();

  const parsed = paymentSubmissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const input = parsed.data;

  const limit = await rateLimit("payment", user.id);
  if (!limit.success) {
    return { ok: false, message: "Too many payment submissions. Please wait before trying again." };
  }

  if (!(await canAccessInvoice(user, input.invoiceId))) {
    return { ok: false, message: "You do not have access to that invoice." };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId },
    select: {
      id: true,
      number: true,
      status: true,
      total: true,
      amountPaid: true,
      currency: true,
      client: { select: { companyName: true } },
    },
  });
  if (!invoice) return { ok: false, message: "That invoice no longer exists." };
  if (invoice.status === "VOID" || invoice.status === "PAID") {
    return { ok: false, message: "This invoice is not open for payment." };
  }

  // An inactive method must never be accepted, even if the form is crafted by
  // hand after it was switched off (PRD §50).
  const method = await prisma.paymentMethodConfig.findUnique({
    where: { method: input.method },
    select: { isActive: true, label: true, minAmount: true, maxAmount: true },
  });
  if (!method?.isActive) {
    return { ok: false, message: "That payment method is not currently available." };
  }
  if (method.minAmount && input.amount < Number(method.minAmount)) {
    return { ok: false, message: `The minimum for ${method.label} is ${method.minAmount}.` };
  }
  if (method.maxAmount && input.amount > Number(method.maxAmount)) {
    return { ok: false, message: `The maximum for ${method.label} is ${method.maxAmount}.` };
  }

  const outstanding = Number(invoice.total) - Number(invoice.amountPaid);
  if (input.amount > outstanding + 0.01) {
    return {
      ok: false,
      message: `That is more than the outstanding balance of ${outstanding.toFixed(2)} ${invoice.currency}.`,
      fieldErrors: { amount: ["Amount exceeds the outstanding balance."] },
    };
  }

  const duplicate = await prisma.payment.findUnique({
    where: { trxId: input.trxId },
    select: { id: true },
  });
  if (duplicate) {
    return {
      ok: false,
      message: "That transaction ID has already been submitted.",
      fieldErrors: { trxId: ["This transaction ID is already recorded."] },
    };
  }

  const payment = await prisma.payment.create({
    data: {
      reference: reference("PAY"),
      invoiceId: invoice.id,
      method: input.method,
      amount: new Prisma.Decimal(input.amount),
      currency: invoice.currency,
      trxId: input.trxId,
      senderNumber: input.senderNumber || null,
      proofUrl: input.proofUrl || null,
      status: "PENDING_VERIFICATION",
      submittedById: user.id,
    },
    select: { id: true, reference: true },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "payment.submitted",
    entityType: "Payment",
    entityId: payment.id,
    summary: `Payment ${payment.reference} submitted against ${invoice.number}`,
    metadata: { method: input.method, amount: input.amount },
  });

  await notifyRoles(["FINANCE", "ADMIN", "SUPER_ADMIN"], {
    type: "PAYMENT_RECEIVED",
    title: `Payment awaiting verification — ${invoice.number}`,
    body: `${invoice.client.companyName ?? "A client"} submitted ${input.amount} ${invoice.currency} via ${method.label}.`,
    href: "/dashboard/finance/payments",
    telegram: true,
  });

  revalidatePath("/dashboard/my-payments");
  revalidatePath(`/dashboard/my-invoices/${invoice.id}`);
  return {
    ok: true,
    message: `Submitted. Reference ${payment.reference} — our finance team will verify it shortly.`,
  };
}

/**
 * Verification is permission-gated (`payment.verify`) and audited. A direct
 * call from a CLIENT session is rejected here even if the request is crafted
 * by hand (PRD §50).
 */
export async function decidePaymentAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("payment.verify");

  const parsed = paymentDecisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { paymentId, decision, reason } = parsed.data;

  if (decision === "REJECT" && !reason) {
    return {
      ok: false,
      message: "A rejection reason is required — the client sees it.",
      fieldErrors: { reason: ["Explain why this payment was rejected."] },
    };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      reference: true,
      status: true,
      amount: true,
      currency: true,
      invoice: {
        select: {
          id: true,
          number: true,
          total: true,
          amountPaid: true,
          client: { select: { user: { select: { id: true } } } },
        },
      },
    },
  });
  if (!payment) return { ok: false, message: "That payment no longer exists." };

  // Idempotency: a second verification must never double-count the money.
  if (payment.status !== "PENDING_VERIFICATION") {
    return { ok: false, message: `This payment is already ${payment.status.toLowerCase().replace(/_/g, " ")}.` };
  }

  if (decision === "REJECT") {
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectionReason: reason || null,
        verifiedById: user.id,
      },
    });

    await audit({
      actorId: user.id,
      actorRole: user.role,
      action: "payment.reject",
      entityType: "Payment",
      entityId: paymentId,
      summary: `Payment ${payment.reference} rejected`,
      metadata: { reason },
    });

    await notify({
      userId: payment.invoice.client.user.id,
      type: "PAYMENT_REJECTED",
      title: `Payment could not be verified — ${payment.invoice.number}`,
      body: reason || "Our finance team could not match this transaction.",
      href: `/dashboard/my-invoices/${payment.invoice.id}`,
    });

    revalidatePath("/dashboard/finance/payments");
    return { ok: true, message: "Payment rejected and the client has been notified." };
  }

  const newAmountPaid = Number(payment.invoice.amountPaid) + Number(payment.amount);
  const invoiceTotal = Number(payment.invoice.total);
  const fullySettled = newAmountPaid >= invoiceTotal - 0.01;

  const account = await prisma.account.findFirst({ where: { isActive: true }, select: { id: true } });

  // One transaction: payment, invoice balance and the ledger entry move together.
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: { status: "VERIFIED", verifiedAt: new Date(), verifiedById: user.id },
    }),
    prisma.invoice.update({
      where: { id: payment.invoice.id },
      data: {
        amountPaid: new Prisma.Decimal(newAmountPaid),
        status: fullySettled ? "PAID" : "PARTIALLY_PAID",
        paidAt: fullySettled ? new Date() : null,
      },
    }),
    prisma.transaction.create({
      data: {
        reference: reference("TXN"),
        accountId: account?.id ?? null,
        type: "INCOME",
        amount: payment.amount,
        currency: payment.currency,
        description: `Payment ${payment.reference} for invoice ${payment.invoice.number}`,
        relatedType: "Payment",
        relatedId: payment.id,
      },
    }),
  ]);

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "payment.verify",
    entityType: "Payment",
    entityId: paymentId,
    summary: `Payment ${payment.reference} verified for invoice ${payment.invoice.number}`,
    metadata: { amount: Number(payment.amount), invoiceSettled: fullySettled },
  });

  await notify({
    userId: payment.invoice.client.user.id,
    type: "PAYMENT_VERIFIED",
    title: `Payment verified — ${payment.invoice.number}`,
    body: fullySettled
      ? "Thank you. This invoice is now fully settled."
      : `We received ${Number(payment.amount)} ${payment.currency}. The remaining balance is shown on the invoice.`,
    href: `/dashboard/my-invoices/${payment.invoice.id}`,
  });

  await sendConversionEvent({
    eventName: "Purchase",
    eventId: newEventId(),
    value: Number(payment.amount),
    currency: payment.currency,
  });

  revalidatePath("/dashboard/finance/payments");
  revalidatePath("/dashboard/finance/invoices");
  return { ok: true, message: "Payment verified and the invoice updated." };
}

export async function createRefundAction(paymentId: string, amount: number, reason: string) {
  const user = await authorize("refund.create");

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, reference: true, amount: true, currency: true, status: true, invoiceId: true },
  });
  if (!payment) throw new Error("Payment not found.");
  if (payment.status !== "VERIFIED") throw new Error("Only a verified payment can be refunded.");
  if (amount <= 0 || amount > Number(payment.amount)) {
    throw new Error("Refund amount must be positive and no more than the original payment.");
  }

  await prisma.$transaction([
    prisma.refund.create({
      data: {
        reference: reference("REF"),
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        amount: new Prisma.Decimal(amount),
        currency: payment.currency,
        reason: reason.slice(0, 500),
        createdById: user.id,
      },
    }),
    prisma.payment.update({ where: { id: paymentId }, data: { status: "REFUNDED" } }),
    prisma.transaction.create({
      data: {
        reference: reference("TXN"),
        type: "REFUND",
        amount: new Prisma.Decimal(amount),
        currency: payment.currency,
        description: `Refund against payment ${payment.reference}`,
        relatedType: "Payment",
        relatedId: payment.id,
      },
    }),
  ]);

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "refund.create",
    entityType: "Payment",
    entityId: paymentId,
    summary: `Refund of ${amount} ${payment.currency} raised against ${payment.reference}`,
    metadata: { reason },
  });

  revalidatePath("/dashboard/finance/refunds");
  revalidatePath("/dashboard/finance/payments");
}

export async function createExpenseAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("expense.manage");

  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);

  const expense = await prisma.expense.create({
    data: {
      reference: reference("EXP"),
      category: parsed.data.category,
      vendor: parsed.data.vendor || null,
      description: parsed.data.description || null,
      amount: new Prisma.Decimal(parsed.data.amount),
      currency: parsed.data.currency,
      spentAt: new Date(parsed.data.spentAt),
      createdById: user.id,
      status: "SUBMITTED",
    },
    select: { id: true, reference: true },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "expense.created",
    entityType: "Expense",
    entityId: expense.id,
    summary: `Expense ${expense.reference} recorded for ${parsed.data.amount} ${parsed.data.currency}`,
  });

  revalidatePath("/dashboard/finance/expenses");
  return { ok: true, message: `Expense ${expense.reference} recorded.` };
}

export async function approveExpenseAction(expenseId: string, approve: boolean) {
  const user = await authorize("finance.approve");

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { id: true, reference: true, amount: true, currency: true, status: true },
  });
  if (!expense) throw new Error("Expense not found.");
  if (expense.status !== "SUBMITTED") throw new Error("Only a submitted expense can be decided.");

  await prisma.$transaction([
    prisma.expense.update({
      where: { id: expenseId },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
        approvedById: user.id,
        approvedAt: approve ? new Date() : null,
      },
    }),
    ...(approve
      ? [
          prisma.transaction.create({
            data: {
              reference: reference("TXN"),
              type: "EXPENSE" as const,
              amount: expense.amount,
              currency: expense.currency,
              description: `Expense ${expense.reference} approved`,
              relatedType: "Expense",
              relatedId: expense.id,
            },
          }),
        ]
      : []),
  ]);

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: approve ? "expense.approved" : "expense.rejected",
    entityType: "Expense",
    entityId: expenseId,
    summary: `Expense ${expense.reference} ${approve ? "approved" : "rejected"}`,
  });

  revalidatePath("/dashboard/finance/expenses");
}
