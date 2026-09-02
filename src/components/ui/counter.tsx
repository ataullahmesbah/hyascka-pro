"use client";

import * as React from "react";

/**
 * Count-up statistic.
 *
 * This one *is* a client component, unlike `Reveal`. Animating a number means
 * rewriting text React rendered, and doing that from the site's vanilla-JS
 * runtime raced hydration. There are only a handful of counters on a page, so
 * the cost of letting React own them is negligible — where forty reveals as
 * client components were not.
 *
 * The server-rendered value is the final number, so crawlers and no-JS visitors
 * see the real figure and the animation causes no layout shift.
 */
export function Counter({
  value,
  suffix = "",
  duration = 1200,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = React.useState(value);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) requestAnimationFrame(tick);
        };
        setDisplay(0);
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}
