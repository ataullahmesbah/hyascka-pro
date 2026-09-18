"use client";

import * as React from "react";
import { ArrowUp, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { trackEvent } from "@/components/marketing/tracking";

export function BackToTop() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 1200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-5 left-5 z-drawer inline-flex h-10 w-10 items-center justify-center rounded-btn border border-line-strong bg-surface text-ink-soft shadow-sm transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}

/**
 * Scroll/exit-intent CTA, shown at most once a month per browser.
 *
 * It used to remember in sessionStorage, which is per tab: a second tab, or
 * tomorrow's visit, counted as a first visit, so a returning reader met the
 * same panel over and over. Remembering in localStorage with a date makes
 * "once" mean once, and "Not now" mean not now — for thirty days.
 */
const EXIT_CTA_KEY = "hyascka.exitCta";
const EXIT_CTA_QUIET_DAYS = 30;

function exitCtaSilenced() {
  try {
    const seen = Number(localStorage.getItem(EXIT_CTA_KEY));
    if (!seen) return false;
    return Date.now() - seen < EXIT_CTA_QUIET_DAYS * 864e5;
  } catch {
    // Private browsing can throw on access. Treat that as "say nothing".
    return true;
  }
}

function silenceExitCta() {
  try {
    localStorage.setItem(EXIT_CTA_KEY, String(Date.now()));
  } catch {
    /* Nothing to remember it in; the panel simply closes. */
  }
}

export function ExitIntentCta() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (exitCtaSilenced()) return;

    const trigger = () => {
      setOpen(true);
      silenceExitCta();
      cleanup();
    };
    const onMouseOut = (event: MouseEvent) => {
      if (event.clientY <= 0 && !event.relatedTarget) trigger();
    };
    const onScroll = () => {
      const progress = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      if (progress > 0.75) trigger();
    };
    const cleanup = () => {
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
    };

    const timer = setTimeout(() => {
      document.addEventListener("mouseout", onMouseOut);
      window.addEventListener("scroll", onScroll, { passive: true });
    }, 15000);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, []);

  const dismiss = () => {
    silenceExitCta();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="complementary"
      aria-label="Get a proposal"
      className="fixed bottom-5 left-5 z-drawer w-[min(21rem,calc(100vw-2.5rem))] animate-fade-up rounded-xl border border-line bg-surface p-5 shadow-lg"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 rounded-btn p-1 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="text-step-0 font-semibold">Before you go</p>
      <p className="mt-1.5 text-step--1 text-ink-soft">
        Tell us what you are trying to grow and we will send a fixed-scope proposal — usually within
        two working days.
      </p>
      <div className="mt-4 flex gap-2">
        <ButtonLink href="/contact" size="sm" onClick={() => trackEvent("exit_intent_cta_click")}>
          Get a proposal
        </ButtonLink>
        <Button variant="ghost" size="sm" onClick={dismiss}>
          Not now
        </Button>
      </div>
    </div>
  );
}

/** Scheduled-maintenance notice: informational, never blocking. */
export function MaintenanceNoticeBar({ text, endAt }: { text: string; endAt?: string | null }) {
  const [hidden, setHidden] = React.useState(false);
  if (hidden || !text) return null;
  return (
    <div className={cn("border-b border-warning/35 bg-warning-soft text-warning")}>
      <div className="container-x flex items-center justify-center gap-3 py-2 text-center text-step--2 font-medium">
        <p>
          {text}
          {endAt ? ` · Expected back by ${new Date(endAt).toLocaleString()}` : ""}
        </p>
        <button
          type="button"
          aria-label="Dismiss maintenance notice"
          onClick={() => setHidden(true)}
          className="rounded p-1 transition-colors hover:bg-warning/20"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
