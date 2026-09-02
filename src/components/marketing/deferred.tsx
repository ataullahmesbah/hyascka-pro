"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import type { AssistantConfig } from "@/components/marketing/assistant";

/**
 * Non-critical page furniture, mounted after the browser goes idle.
 *
 * None of this is needed for first paint or for reading the page, and loading it
 * eagerly cost measurable Total Blocking Time. Deferring keeps the main thread
 * free while the visitor is still reading the hero.
 *
 * The cookie banner is deliberately NOT in here. Consent has to be asked before
 * non-essential cookies are set, so it cannot wait for an idle callback — it is
 * mounted directly by the layout.
 */
const Assistant = dynamic(
  () => import("@/components/marketing/assistant").then((m) => m.Assistant),
  { ssr: false },
);
const WhatsappWidget = dynamic(
  () => import("@/components/marketing/assistant").then((m) => m.WhatsappWidget),
  { ssr: false },
);
const BackToTop = dynamic(
  () => import("@/components/marketing/widgets").then((m) => m.BackToTop),
  { ssr: false },
);
const ExitIntentCta = dynamic(
  () => import("@/components/marketing/widgets").then((m) => m.ExitIntentCta),
  { ssr: false },
);

function useIdle(delay = 1500) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const start = () => !cancelled && setReady(true);

    const idle = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;

    if (idle) {
      idle(start, { timeout: delay });
    } else {
      setTimeout(start, delay);
    }

    // Any real interaction means the visitor is here — bring the widgets in now.
    const onInteract = () => start();
    window.addEventListener("pointerdown", onInteract, { once: true, passive: true });
    window.addEventListener("keydown", onInteract, { once: true });
    window.addEventListener("scroll", onInteract, { once: true, passive: true });

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("scroll", onInteract);
    };
  }, [delay]);

  return ready;
}

export function DeferredWidgets({
  whatsapp,
  assistant,
  exitIntent,
}: {
  whatsapp: { phone: string; greeting: string; label: string } | null;
  assistant: AssistantConfig | null;
  exitIntent: boolean;
}) {
  const ready = useIdle();
  if (!ready) return null;

  return (
    <>
      <BackToTop />
      {whatsapp ? (
        <WhatsappWidget phone={whatsapp.phone} greeting={whatsapp.greeting} label={whatsapp.label} />
      ) : null}
      {assistant ? <Assistant config={assistant} offset={Boolean(whatsapp)} /> : null}
      {exitIntent ? <ExitIntentCta /> : null}
    </>
  );
}
