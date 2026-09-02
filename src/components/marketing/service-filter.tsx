"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Progressive-enhancement filter: the full grid is server-rendered and
 * indexable, and this only hides cards client-side. With JavaScript disabled
 * every service is still visible and crawlable.
 */
export function ServiceFilter({
  categories,
  services,
  children,
}: {
  categories: { slug: string; name: string }[];
  services: { slug: string; categorySlug: string }[];
  children: React.ReactNode;
}) {
  const [active, setActive] = React.useState<string>("all");
  const [query, setQuery] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const term = query.trim().toLowerCase();

    for (const service of services) {
      const card = container.querySelector<HTMLElement>(`a[href="/services/${service.slug}"]`);
      const wrapper = card?.closest("article") as HTMLElement | null;
      if (!wrapper) continue;
      const matchesCategory = active === "all" || service.categorySlug === active;
      const matchesQuery = !term || (card?.textContent ?? "").toLowerCase().includes(term);
      wrapper.hidden = !(matchesCategory && matchesQuery);
    }
  }, [active, query, services]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {[{ slug: "all", name: "All services" }, ...categories].map((category) => (
            <button
              key={category.slug}
              type="button"
              aria-pressed={active === category.slug}
              onClick={() => setActive(category.slug)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                active === category.slug
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border hover:bg-muted",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="sm:w-64">
          <label htmlFor="service-search" className="sr-only">
            Search services
          </label>
          <input
            id="service-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search services…"
            className="h-10 w-full rounded-full border border-input bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>
      <div ref={ref}>{children}</div>
    </div>
  );
}
