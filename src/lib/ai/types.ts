/** Shared between the assistant providers, so the route never knows which ran. */
export type ChatTurn = { role: "user" | "assistant"; content: string };

export type AssistantResult =
    | { ok: true; reply: string }
    | { ok: false; error: string; status?: number };
