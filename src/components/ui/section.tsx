import * as React from "react";

import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal className={cn("max-w-[60ch]", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2 className={cn("text-step-4 font-extrabold", eyebrow && "mt-4")}>{title}</h2>
      {description ? (
        <p className="mt-4 text-step-0 leading-relaxed text-ink-soft">{description}</p>
      ) : null}
    </Reveal>
  );
}

/** Compact page header used by every non-home public page. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="hero-surface relative overflow-hidden border-b border-line">
      <div className="grid-texture pointer-events-none absolute inset-0" aria-hidden />
      <div className="glow-1 -top-40 left-1/2 h-72 w-[38rem] -translate-x-1/2" aria-hidden />
      <div className="container-x relative py-14 md:py-20">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1 className={cn("max-w-[22ch] text-step-5 font-extrabold", eyebrow && "mt-5")}>{title}</h1>
        {description ? (
          <p className="mt-5 max-w-[62ch] text-step-1 leading-relaxed text-ink-soft">{description}</p>
        ) : null}
        {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </header>
  );
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
