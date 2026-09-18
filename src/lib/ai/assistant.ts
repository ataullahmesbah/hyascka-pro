import "server-only";

import { askGemini } from "@/lib/ai/gemini";
import { askGroq, isGroqConfigured } from "@/lib/ai/groq";
import type { AssistantResult, ChatTurn } from "@/lib/ai/types";

/**
 * Which model answers the site chat (PRD §7.3).
 *
 * Whichever key is present wins, so switching provider is an environment
 * change and not a deployment. Set AI_PROVIDER to force one when both keys
 * exist — otherwise Groq is preferred, because its free tier is the one that
 * survives a public page without a card on file.
 */
export type AssistantProvider = "groq" | "gemini";

export function assistantProvider(): AssistantProvider | null {
    const forced = process.env.AI_PROVIDER?.trim().toLowerCase();
    if (forced === "groq") return isGroqConfigured() ? "groq" : null;
    if (forced === "gemini") return process.env.GEMINI_API_KEY ? "gemini" : null;

    if (isGroqConfigured()) return "groq";
    if (process.env.GEMINI_API_KEY) return "gemini";
    return null;
}

export function isAssistantConfigured() {
    return assistantProvider() !== null;
}

/** The model name in use, for the dashboard's status line. */
export function assistantModel(): string | null {
    switch (assistantProvider()) {
        case "groq":
            return process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
        case "gemini":
            return process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
        default:
            return null;
    }
}

export async function askAssistant(input: {
    system: string;
    history: ChatTurn[];
    message: string;
    signal?: AbortSignal;
}): Promise<AssistantResult> {
    switch (assistantProvider()) {
        case "groq":
            return askGroq(input);
        case "gemini":
            return askGemini(input);
        default:
            return { ok: false, error: "The assistant is not configured yet." };
    }
}