"use client";

import * as React from "react";
import Link from "next/link";
import { Bot, Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/components/marketing/tracking";

type Turn = { role: "user" | "assistant"; content: string };

export type AssistantConfig = { name: string; greeting: string; suggestions: string[] };

/**
 * Public AI assistant (PRD §7.3). The browser only ever talks to /api/chat —
 * the Gemini key and the knowledge pack stay on the server.
 */
export function Assistant({ config, offset }: { config: AssistantConfig; offset: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [input, setInput] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, pending]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const send = React.useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || pending) return;

      setError(null);
      setInput("");
      const history = turns.slice(-10);
      setTurns((current) => [...current, { role: "user", content: message }]);
      setPending(true);
      trackEvent("assistant_message");

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, history }),
        });
        const data = (await response.json()) as { reply?: string; error?: string };
        if (!response.ok || !data.reply) {
          setError(data.error ?? "Something went wrong. Please try again.");
        } else {
          setTurns((current) => [...current, { role: "assistant", content: data.reply! }]);
        }
      } catch {
        setError("Could not reach the assistant. Check your connection and try again.");
      } finally {
        setPending(false);
        inputRef.current?.focus();
      }
    },
    [pending, turns],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="hy-assistant"
        aria-label={open ? "Close assistant" : `Chat with ${config.name}`}
        className={cn(
          "fixed z-drawer inline-flex h-12 w-12 items-center justify-center rounded-pill bg-accent text-accent-ink shadow-accent transition-transform duration-fast hover:scale-105 motion-reduce:transform-none",
          "bottom-5 right-5",
          offset && "bottom-[4.75rem]",
        )}
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {open ? (
        <div
          id="hy-assistant"
          role="dialog"
          aria-label={`${config.name} — assistant`}
          className={cn(
            "fixed z-drawer flex w-[min(23rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg",
            "bottom-20 right-5 max-h-[min(32rem,calc(100dvh-7rem))]",
            offset && "bottom-[8.5rem]",
          )}
        >
          <header className="flex shrink-0 items-center gap-2.5 border-b border-line bg-surface-2 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-accent-soft text-accent">
              <Bot className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-step--1 font-semibold text-ink">{config.name}</p>
              <p className="text-step--2 text-ink-muted">Answers from our published content</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-btn p-1.5 text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
            <Bubble role="assistant">{config.greeting}</Bubble>

            {turns.map((turn, index) => (
              <Bubble key={index} role={turn.role}>
                <AssistantText text={turn.content} />
              </Bubble>
            ))}

            {pending ? (
              <Bubble role="assistant">
                <span className="flex items-center gap-2 text-ink-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking…
                </span>
              </Bubble>
            ) : null}

            {error ? (
              <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-step--2 text-danger">
                {error}
              </p>
            ) : null}

            {!turns.length && config.suggestions.length ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {config.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-pill border border-line px-2.5 py-1 text-step--2 text-ink-soft transition-colors duration-fast hover:border-accent-border hover:bg-surface-2 hover:text-ink"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="flex shrink-0 items-center gap-2 border-t border-line p-3"
          >
            <label htmlFor="hy-assistant-input" className="sr-only">
              Message
            </label>
            <input
              ref={inputRef}
              id="hy-assistant-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={1000}
              placeholder="Ask about services, pricing, process…"
              className="h-10 flex-1 rounded-btn border border-line-strong bg-bg px-3 text-step--1 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
            />
            <Button type="submit" size="icon-sm" disabled={pending || !input.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <p className="shrink-0 border-t border-line px-4 py-2 text-center text-step--2 text-ink-muted">
            AI can make mistakes.{" "}
            <Link href="/contact" className="text-accent hover:underline">
              Talk to a human
            </Link>
          </p>
        </div>
      ) : null}
    </>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  const mine = role === "user";
  return (
    <div className={cn("flex", mine && "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-step--1 leading-relaxed",
          mine ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Turns the relative paths the model is allowed to emit into real links. */
function AssistantText({ text }: { text: string }) {
  const parts = text.split(/(\/[a-z0-9\-/]+)/gi);
  return (
    <>
      {parts.map((part, index) =>
        /^\/[a-z0-9-]/i.test(part) ? (
          <Link key={index} href={part} className="text-accent underline underline-offset-2">
            {part}
          </Link>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

/** Floating WhatsApp entry point — visibility is a dashboard toggle (PRD §7.2). */
export function WhatsappWidget({
  phone,
  greeting,
  label,
}: {
  phone: string;
  greeting: string;
  label: string;
}) {
  const href = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(greeting)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("whatsapp_click")}
      aria-label={label}
      title={label}
      className="fixed bottom-5 right-5 z-drawer inline-flex h-12 w-12 items-center justify-center rounded-pill bg-[#25D366] text-white shadow-md transition-transform duration-fast hover:scale-105 motion-reduce:transform-none"
    >
      <MessageSquare className="h-5 w-5" />
    </a>
  );
}
