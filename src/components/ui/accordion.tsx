import { cn } from "@/lib/utils";

export type AccordionItem = { id: string; question: string; answer: string; category?: string };

/**
 * Accordion built on native `<details>`/`<summary>`.
 *
 * This ships **zero JavaScript**: the browser handles open/close, keyboard and
 * screen-reader semantics for free, and the answers are in the DOM for search
 * engines whether or not the panel is open. On a page with twenty questions
 * that removed a measurable slice of hydration work — the previous React
 * version was one of the larger client components on the homepage.
 *
 * `name` makes a group exclusive (one open at a time) in browsers that support
 * it; elsewhere it degrades to independent disclosures, which is fine.
 */
export function Accordion({
  items,
  className,
  defaultOpenId,
  variant = "card",
  group,
}: {
  items: AccordionItem[];
  className?: string;
  defaultOpenId?: string;
  variant?: "card" | "plain";
  group?: string;
}) {
  return (
    <div
      className={cn(
        variant === "card"
          ? "divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface"
          : "space-y-2",
        className,
      )}
    >
      {items.map((item) => (
        <details
          key={item.id}
          name={group}
          open={defaultOpenId === item.id}
          className={cn(
            "group",
            variant === "plain" && "overflow-hidden rounded-lg border border-line bg-surface",
          )}
        >
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-left transition-colors duration-fast hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
            <span className="text-step-0 font-semibold group-open:text-accent">{item.question}</span>
            <span
              className="mt-1 grid h-4 w-4 shrink-0 place-items-center text-ink-muted transition-transform duration-fast group-open:rotate-45 group-open:text-accent"
              aria-hidden
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M8 3v10M3 8h10" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <p className="px-5 pb-5 text-step--1 leading-relaxed text-ink-soft">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

/**
 * Homepage FAQ: 20 questions split into two labelled parts (PRD §4), so the
 * block reads as two short lists instead of one intimidating one.
 */
export function FaqColumns({ parts }: { parts: { title: string; items: AccordionItem[] }[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      {parts.map((part) => (
        <div key={part.title}>
          <h3 className="mb-4 flex items-center gap-2.5 text-step-1 font-semibold">
            <span className="h-4 w-1 rounded-pill bg-accent" aria-hidden />
            {part.title}
          </h3>
          <Accordion items={part.items} variant="plain" group={`faq-${part.title.replace(/\W+/g, "-")}`} />
        </div>
      ))}
    </div>
  );
}
