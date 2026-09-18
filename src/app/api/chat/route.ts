import { NextResponse, type NextRequest } from "next/server";

import { askAssistant, isAssistantConfigured } from "@/lib/ai/assistant";
import { buildKnowledgePack, systemPrompt } from "@/lib/ai/knowledge";
import { rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { chatRequestSchema } from "@/lib/validation";

/**
 * Public assistant endpoint (PRD §7.3, §9).
 *
 * One of only three routes on the public allow-list. It is rate limited per IP,
 * caps its own body size, and can only read the published-content pack — there
 * is no path from here to any private table.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_000;
const TIMEOUT_MS = 20_000;

export async function POST(request: NextRequest) {
  const settings = await getSettings();
  if (!settings.featureFlags.ai_assistant) {
    return NextResponse.json({ error: "The assistant is turned off." }, { status: 404 });
  }
  if (!isAssistantConfigured()) {
    return NextResponse.json(
      { error: "The assistant is not configured yet. Please use the contact form." },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const limit = await rateLimit("chat", ip);
  if (!limit.success) {
    return NextResponse.json(
      { error: "You have sent a lot of messages. Please wait a minute." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "That message is too long." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ask a question of 1000 characters or fewer." }, { status: 400 });
  }

  const pack = await buildKnowledgePack();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const result = await askAssistant({
      system: systemPrompt(settings.assistant.name, pack.context),
      history: parsed.data.history ?? [],
      message: parsed.data.message,
      signal: controller.signal,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status === 429 ? 429 : 502 });
    }
    return NextResponse.json({ reply: result.reply }, { headers: { "Cache-Control": "no-store" } });
  } finally {
    clearTimeout(timeout);
  }
}
