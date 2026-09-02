"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUp, MessageCircle, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { trackEvent } from "@/components/marketing/tracking";

/** Floating WhatsApp/chat entry point alongside the contact form (PRD §48.1). */
export function ContactWidget({ whatsapp, message }: { whatsapp: string; message: string }) {
  const href = `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("chat_widget_click")}
      aria-label="Message us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full brand-gradient text-white shadow-glow transition-transform hover:scale-105 motion-reduce:transition-none"
    >
      <MessageCircle className="h-5 w-5" />
    </a>
  );
}

export function BackToTop() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 900);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-5 right-20 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-soft transition-colors hover:text-foreground"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}

/**
 * Non-intrusive scroll/exit-intent CTA, shown at most once per session
 * (PRD §39.6). Never blocks the page and is always dismissible.
 */
export function ExitIntentCta() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (sessionStorage.getItem("hyascka.exitCta")) return;

    const trigger = () => {
      setOpen(true);
      sessionStorage.setItem("hyascka.exitCta", "1");
      cleanup();
    };
    const onMouseOut = (event: MouseEvent) => {
      if (event.clientY <= 0 && !event.relatedTarget) trigger();
    };
    const onScroll = () => {
      const progress =
        window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      if (progress > 0.72) trigger();
    };
    const cleanup = () => {
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
    };

    const timer = setTimeout(() => {
      document.addEventListener("mouseout", onMouseOut);
      window.addEventListener("scroll", onScroll, { passive: true });
    }, 12000);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed bottom-5 left-5 z-40 w-[min(22rem,calc(100vw-2.5rem))] animate-fade-up",
        "rounded-2xl border border-border bg-card p-5 shadow-elevated",
      )}
      role="complementary"
      aria-label="Get a proposal"
    >
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Dismiss"
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="font-display text-base font-semibold">Before you go</p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Tell us what you are trying to grow and we will send a fixed-scope proposal — usually within
        two working days.
      </p>
      <div className="mt-4 flex gap-2">
        <ButtonLink href="/contact" size="sm" onClick={() => trackEvent("exit_intent_cta_click")}>
          Get a proposal
        </ButtonLink>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Not now
        </Button>
      </div>
    </div>
  );
}

/** Dismissible campaign strip above the navbar (PRD §7). */
export function AnnouncementBar({
  text,
  href,
  linkLabel,
  storageKey = "hyascka.announcement",
}: {
  text: string;
  href?: string;
  linkLabel?: string;
  storageKey?: string;
}) {
  const [hidden, setHidden] = React.useState(true);

  React.useEffect(() => {
    setHidden(sessionStorage.getItem(storageKey) === text);
  }, [storageKey, text]);

  if (hidden) return null;

  return (
    <div className="relative brand-gradient text-white">
      <div className="container flex items-center justify-center gap-3 py-2 text-center text-[13px] font-medium">
        <p>
          {text}{" "}
          {href ? (
            <Link href={href} className="underline underline-offset-4">
              {linkLabel ?? "Learn more"}
            </Link>
          ) : null}
        </p>
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={() => {
            sessionStorage.setItem(storageKey, text);
            setHidden(true);
          }}
          className="absolute right-4 rounded p-1 transition-colors hover:bg-white/15"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Scheduled-maintenance notice: informational, never blocking (PRD §45.1). */
export function MaintenanceNoticeBar({ text, endAt }: { text: string; endAt?: string | null }) {
  const [hidden, setHidden] = React.useState(false);
  if (hidden || !text) return null;
  return (
    <div className="border-b border-warning/35 bg-warning/12 text-warning">
      <div className="container flex items-center justify-center gap-3 py-2 text-center text-[13px] font-medium">
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
