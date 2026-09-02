import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Scroll reveal — a *server* component.
 *
 * It used to be a client component, which meant a page with forty reveals
 * shipped forty client boundaries and ran forty effects during hydration: a
 * measurable chunk of Total Blocking Time on throttled mobile. Now it renders
 * plain markup carrying `data-reveal`, and one client component (see
 * site-runtime.tsx) drives every element on the page from a single
 * IntersectionObserver. `Counter` needs to rewrite text as it animates, so it
 * stayed a client component of its own — see counter.tsx.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  return (
    <Tag
      data-reveal=""
      className={cn("reveal", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
