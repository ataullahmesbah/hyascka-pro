"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Consent gate for the whole tracking stack (PRD §44.2, §53.3). Nothing
 * analytics- or advertising-related loads until a choice is stored, and the
 * choice can be changed at any time from the footer.
 */
export const CONSENT_KEY = "hyascka.consent";
const CONSENT_EVENT = "hyascka:consent";

export type ConsentValue = "granted" | "denied";

export function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(CONSENT_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

function writeConsent(value: ConsentValue) {
  localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

export function useConsent() {
  const [consent, setConsent] = React.useState<ConsentValue | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setConsent(readConsent());
    setReady(true);
    const listener = (event: Event) => setConsent((event as CustomEvent<ConsentValue>).detail);
    window.addEventListener(CONSENT_EVENT, listener);
    return () => window.removeEventListener(CONSENT_EVENT, listener);
  }, []);

  return { consent, ready, grant: () => writeConsent("granted"), deny: () => writeConsent("denied") };
}

export function CookieConsent() {
  const { consent, ready, grant, deny } = useConsent();
  if (!ready || consent) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-3xl animate-fade-up rounded-2xl border border-border bg-card/95 p-5 shadow-elevated backdrop-blur-xl sm:inset-x-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Cookie className="hidden h-6 w-6 shrink-0 text-primary sm:block" />
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          We use essential cookies to run this site. With your consent we also use analytics and
          advertising cookies to understand what works. Declining changes nothing about what you can
          access here.{" "}
          <Link href="/cookies" className="font-medium text-primary underline-offset-4 hover:underline">
            Cookie policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={deny}>
            Decline
          </Button>
          <Button size="sm" onClick={grant}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => {
        localStorage.removeItem(CONSENT_KEY);
        window.location.reload();
      }}
      className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
    >
      Cookie settings
    </button>
  );
}
