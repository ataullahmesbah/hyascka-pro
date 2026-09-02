"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Accordion } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { FaqSeed } from "@/content/types";

/** Searchable accordion, used once the list grows large (PRD §39.6). */
export function FaqSearch({ items }: { items: FaqSeed[] }) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");

  const categories = React.useMemo(
    () => ["all", ...new Set(items.map((item) => item.category))],
    [items],
  );

  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesQuery =
        !term ||
        item.question.toLowerCase().includes(term) ||
        item.answer.toLowerCase().includes(term);
      return matchesCategory && matchesQuery;
    });
  }, [items, query, category]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <label htmlFor="faq-search" className="sr-only">
          Search questions
        </label>
        <input
          id="faq-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search questions…"
          className="h-12 w-full rounded-full border border-line-strong bg-surface pl-11 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              category === item ? "border-accent bg-accent-soft text-accent" : "border-line hover:bg-surface-2",
            )}
          >
            {item === "all" ? "All" : item}
          </button>
        ))}
      </div>

      <p className="mt-5 text-sm text-ink-muted" role="status">
        {filtered.length} {filtered.length === 1 ? "question" : "questions"}
      </p>

      {filtered.length ? (
        <Accordion
          className="mt-3"
          items={filtered.map((faq, index) => ({
            id: `faq-${index}-${faq.question.slice(0, 12)}`,
            question: faq.question,
            answer: faq.answer,
          }))}
        />
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-line p-8 text-center text-sm text-ink-muted">
          Nothing matches that search. Try a different term, or ask us directly.
        </p>
      )}
    </div>
  );
}
