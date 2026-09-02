"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/** Interactive portfolio filter (PRD §39.6), progressive-enhancement only. */
export function WorkFilter({
  industries,
  slugs,
  children,
}: {
  industries: string[];
  slugs: { slug: string; industry: string }[];
  children: React.ReactNode;
}) {
  const [active, setActive] = React.useState("all");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = ref.current;
    if (!container) return;
    for (const item of slugs) {
      const wrapper = container
        .querySelector<HTMLElement>(`a[href="/work/${item.slug}"]`)
        ?.closest("article") as HTMLElement | null;
      if (wrapper) wrapper.hidden = !(active === "all" || item.industry === active);
    }
  }, [active, slugs]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by industry">
        {["all", ...industries].map((industry) => (
          <button
            key={industry}
            type="button"
            aria-pressed={active === industry}
            onClick={() => setActive(industry)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active === industry
                ? "border-accent bg-accent-soft text-accent"
                : "border-line hover:bg-surface-2",
            )}
          >
            {industry === "all" ? "All industries" : industry}
          </button>
        ))}
      </div>
      <div ref={ref}>{children}</div>
    </div>
  );
}
