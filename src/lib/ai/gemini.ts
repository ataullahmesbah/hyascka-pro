import "server-only";

/**
 * Minimal Gemini client (PRD §7.3).
 *
 * Deliberately a plain fetch rather than an SDK: one request shape, no extra
 * dependency in the deployment, and the API key never leaves the server.
 */
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type GeminiResult =
  | { ok: true; reply: string }
  | { ok: false; error: string; status?: number };

export function isAssistantConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function askGemini({
  system,
  history,
  message,
  signal,
}: {
  system: string;
  history: ChatTurn[];
  message: string;
  signal?: AbortSignal;
}): Promise<GeminiResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, error: "The assistant is not configured yet." };

  const contents = [
    ...history.slice(-10).map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content.slice(0, 4000) }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
            topP: 0.9,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
        signal,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      // Never surface the provider's raw error to a visitor.
      console.error("[gemini]", response.status, await response.text().catch(() => ""));
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
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();

    if (!reply) {
      return { ok: false, error: "I could not produce an answer for that. Try rephrasing it?" };
    }
    return { ok: true, reply };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return { ok: false, error: "That took too long. Please try again." };
    }
    console.error("[gemini] request failed:", error);
    return { ok: false, error: "The assistant is temporarily unavailable." };
  }
}
