"use server";

import { prisma, isDatabaseConfigured } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { requestContext } from "@/lib/auth/session";
import { audit, securityEvent } from "@/lib/audit";
import { notifyRoles } from "@/lib/notifications";
import { enqueue } from "@/lib/providers/jobs";
import { emailLayout, sendEmail } from "@/lib/providers/email";
import { sendTelegram } from "@/lib/providers/telegram";
import { newEventId, sendConversionEvent } from "@/lib/tracking";
import { contactSchema, newsletterSchema, toActionState, type ActionState } from "@/lib/validation";
import { reference } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/seo";

/** Anything a visitor typed is escaped before it reaches an email template. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Contact → automation workflow (PRD §17).
 *
 * Order matters: the lead is persisted first and the response returns
 * immediately; email and Telegram delivery happen in a background job. A slow
 * or failing provider can never cost us the lead.
 */
export async function submitContactForm(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const input = parsed.data;

  const { ipAddress, userAgent } = await requestContext();
  const limit = await rateLimit("contact", ipAddress ?? input.email);
  if (!limit.success) {
    await securityEvent({ email: input.email, type: "RATE_LIMITED", detail: "contact form" });
    return {
      ok: false,
      message: "Too many submissions from this connection. Please try again in a little while.",
    };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      message:
        "The site is running without a database, so the form cannot store your enquiry. Email hello@hyascka.com in the meantime.",
    };
  }

  const service = input.serviceSlug
    ? await prisma.service.findUnique({ where: { slug: input.serviceSlug }, select: { id: true, title: true } })
    : null;

  const lead = await prisma.lead.create({
    data: {
      reference: reference("LEAD"),
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      company: input.company || null,
      budget: input.budget || null,
      serviceId: service?.id ?? null,
      message: input.message,
      source: "website",
      ipAddress,
      userAgent,
    },
    select: { id: true, reference: true },
  });

  await audit({
    action: "lead.created",
    entityType: "Lead",
    entityId: lead.id,
    summary: `New website enquiry ${lead.reference} from ${input.email}`,
    metadata: { service: service?.title ?? null, budget: input.budget || null },
  });

  const settings = await getSettings();

  // Everything below is best-effort and off the critical path.
  await notifyRoles(["SUPER_ADMIN", "ADMIN"], {
    type: "LEAD_CREATED",
    title: `New enquiry — ${input.name}`,
    body: `${input.company || "Individual"} · ${service?.title ?? "General enquiry"} · ${input.budget || "budget not stated"}`,
    href: `/dashboard/leads/${lead.id}`,
    telegram: true,
  });

  // Two emails, both off the critical path: an acknowledgement to the sender
  // and an alert to the team inbox (PRD §7.1).
  await enqueue("lead.notify", { leadId: lead.id }, async () => {
    const safeMessage = escapeHtml(input.message).replace(/\n/g, "<br />");

    await sendEmail({
      to: input.email,
      replyTo: settings.contact.email,
      subject: `We received your enquiry — ${settings.brand.siteName}`,
      html: emailLayout(
        `Thanks, ${escapeHtml(input.name.split(" ")[0])}`,
        `<p>We have your enquiry (reference <strong>${lead.reference}</strong>) and will reply within one business day.</p>
         <p>Here is what you sent us:</p>
         <blockquote style="border-left:3px solid #4F46E5;padding-left:12px;color:#9aa3bb;margin:12px 0">${safeMessage}</blockquote>
         <p style="color:#9aa3bb;font-size:13px">If anything is urgent, reply to this email and it reaches the same team.</p>`,
      ),
      text: `Thanks ${input.name}. Your enquiry reference is ${lead.reference}. We will reply within one business day.`,
    });

    await sendEmail({
      to: settings.contact.email,
      replyTo: input.email,
      subject: `New enquiry ${lead.reference} — ${input.name}${input.company ? ` (${input.company})` : ""}`,
      html: emailLayout(
        `New enquiry from ${escapeHtml(input.name)}`,
        `<table style="width:100%;font-size:14px;color:#c3cbe0;border-collapse:collapse">
           <tr><td style="padding:4px 0;color:#8a93ae">Email</td><td>${escapeHtml(input.email)}</td></tr>
           <tr><td style="padding:4px 0;color:#8a93ae">Phone</td><td>${escapeHtml(input.phone || "—")}</td></tr>
           <tr><td style="padding:4px 0;color:#8a93ae">Company</td><td>${escapeHtml(input.company || "—")}</td></tr>
           <tr><td style="padding:4px 0;color:#8a93ae">Service</td><td>${escapeHtml(service?.title ?? "General enquiry")}</td></tr>
           <tr><td style="padding:4px 0;color:#8a93ae">Budget</td><td>${escapeHtml(input.budget || "Not stated")}</td></tr>
         </table>
         <blockquote style="border-left:3px solid #4F46E5;padding-left:12px;color:#c3cbe0;margin:16px 0">${safeMessage}</blockquote>`,
        { label: "Open in dashboard", href: `${siteUrl()}/dashboard/leads/${lead.id}` },
      ),
      text: `New enquiry ${lead.reference} from ${input.name} <${input.email}>\n\n${input.message}`,
    });

    await sendTelegram(
      `<b>New enquiry ${lead.reference}</b>\n${input.name} (${input.email})\n${input.company || "—"} · ${input.budget || "budget not stated"}\n${service?.title ?? "General"}`,
    );
  });

  await sendConversionEvent({
    eventName: "Lead",
    eventId: newEventId(),
    email: input.email,
    phone: input.phone || null,
    clientIp: ipAddress,
    userAgent,
  });

  return {
    ok: true,
    message: `Thank you — your enquiry is with us. Reference ${lead.reference}. We reply within one business day.`,
    data: { reference: lead.reference },
  };
}

export async function subscribeToNewsletter(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = newsletterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);

  const { ipAddress } = await requestContext();
  const limit = await rateLimit("newsletter", ipAddress ?? parsed.data.email);
  if (!limit.success) return { ok: false, message: "Please try again in a little while." };

  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Newsletter storage is not configured yet." };
  }

  await prisma.subscriber.upsert({
    where: { email: parsed.data.email },
    update: {},
    create: { email: parsed.data.email, source: "footer" },
  });

  return { ok: true, message: "You are subscribed. Look out for the next issue." };
}
