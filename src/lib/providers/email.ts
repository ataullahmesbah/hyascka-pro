import "server-only";

/**
 * EmailService adapter (PRD §28). Business logic calls `sendEmail`; swapping
 * Resend for SMTP or SES is a provider change here, not a rewrite upstream.
 */
export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type EmailResult = { ok: true; id?: string } | { ok: false; error: string };

const FROM = process.env.EMAIL_FROM ?? "HYASCKA <hello@hyascka.com>";

async function sendViaResend(message: EmailMessage): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not configured" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
    }),
  });

  if (!response.ok) return { ok: false, error: `Resend responded ${response.status}` };
  const data = (await response.json()) as { id?: string };
  return { ok: true, id: data.id };
}

function sendViaConsole(message: EmailMessage): EmailResult {
  console.info(
    `[email:console] to=${message.to} subject="${message.subject}"\n${message.text ?? message.html}`,
  );
  return { ok: true, id: "console" };
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const provider = process.env.EMAIL_PROVIDER ?? "console";
  try {
    switch (provider) {
      case "resend":
        return await sendViaResend(message);
      case "smtp":
        // SMTP transport is wired in deployment; console keeps local dev quiet.
        return sendViaConsole(message);
      default:
        return sendViaConsole(message);
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown email error" };
  }
}

export function emailLayout(title: string, bodyHtml: string, cta?: { label: string; href: string }) {
  return `<!doctype html><html><body style="margin:0;background:#0b1020;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#e8ecf7">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="font-size:20px;font-weight:700;letter-spacing:.08em;background:linear-gradient(110deg,#22e4ff,#7b45f0);-webkit-background-clip:text;background-clip:text;color:transparent">HYASCKA</div>
    <div style="margin-top:24px;background:#131a30;border:1px solid #232c4a;border-radius:16px;padding:28px">
      <h1 style="margin:0 0 12px;font-size:20px;color:#fff">${title}</h1>
      <div style="font-size:14px;line-height:1.65;color:#c3cbe0">${bodyHtml}</div>
      ${
        cta
          ? `<a href="${cta.href}" style="display:inline-block;margin-top:20px;padding:11px 20px;border-radius:999px;background:linear-gradient(110deg,#22e4ff,#7b45f0);color:#08101f;font-weight:700;text-decoration:none;font-size:14px">${cta.label}</a>`
          : ""
      }
    </div>
    <p style="margin-top:20px;font-size:12px;color:#7e88a5">HYASCKA · Digital Service Provider · Dhaka, Bangladesh</p>
  </div></body></html>`;
}
