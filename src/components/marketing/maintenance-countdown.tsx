"use client";

import * as React from "react";

/** Expected-back-time countdown driven by the configured end time (§45.1). */
export function MaintenanceCountdown({ endAt }: { endAt: string }) {
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    const target = new Date(endAt).getTime();
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endAt]);

  if (remaining === null) return null;
  if (remaining === 0) {
    return (
      <p className="mt-8 text-sm font-medium text-success">
        We should be back — try refreshing the page.
      </p>
    );
  }

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  return (
    <div className="mt-8" role="timer" aria-live="off">
      <p className="text-xs uppercase tracking-wider text-ink-muted">Expected back in</p>
      <p className="accent-text mt-2 font-display text-4xl font-extrabold tabular-nums">
        {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
        {String(seconds).padStart(2, "0")}
      </p>
    </div>
  );
}
