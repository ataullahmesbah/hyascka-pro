import "server-only";

import type { AssistantResult, ChatTurn } from "@/lib/ai/types";

/**
 * Groq client (PRD §7.3, second provider).
 *
 * Groq serves open models on its own inference hardware behind an
 * OpenAI-compatible endpoint, so this is the same plain fetch as the Gemini
 * adapter with a different body shape — no SDK, and the key stays server-side.
 *
 * The free tier is rate limited per minute and per day rather than billed,
 * which is why a 429 is reported to the visitor as "busy" rather than as an
 * error: it usually clears within the minute.
 */
const MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

export async function askGroq({
  system,
  history,
  message,
  signal,
}: {
  system: string;
  history: ChatTurn[];
  message: string;
  signal?: AbortSignal;
}): Promise<AssistantResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { ok: false, error: "The assistant is not configured yet." };

  const messages = [
    { role: "system", content: system },
    ...history.slice(-10).map((turn) => ({
      role: turn.role === "assistant" ? "assistant" : "user",
      content: turn.content.slice(0, 4000),
    })),
    { role: "user", content: message },
  ];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.3,
        /*
         * Headroom, not an answer length. The reply itself is two to four
         * sentences — the system prompt says so — but a reasoning model bills
         * its thinking against this same budget, and when the budget runs out
         * mid-thought the content field comes back empty and the visitor sees
         * "I could not produce an answer".
         */
        max_completion_tokens: 1200,
        top_p: 0.9,
        stream: false,
      }),
      signal,
      cache: "no-store",
    });

    if (!response.ok) {
      // Never surface the provider's raw error to a visitor.
      console.error("[groq]", response.status, await response.text().catch(() => ""));
      return {
        ok: false,
        status: response.status,
        error:
          response.status === 429
            ? "The assistant is busy right now. Please try again in a moment."
            : "The assistant could not answer that just now.",
      };
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return { ok: false, error: "I could not produce an answer for that. Try rephrasing it?" };
    }
    return { ok: true, reply };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return { ok: false, error: "That took too long. Please try again." };
    }
    console.error("[groq] request failed:", error);
    return { ok: false, error: "The assistant is temporarily unavailable." };
  }
}
