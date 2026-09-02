"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Select } from "@/components/ui/field";

/** URL-driven filters, so a filtered list stays shareable and bookmarkable. */
export function ListFilters({
  statuses,
  placeholder = "Search…",
}: {
  statuses?: { value: string; label: string }[];
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = React.useState(params.get("q") ?? "");

  const push = React.useCallback(
    (next: URLSearchParams) => {
      next.delete("page");
      const search = next.toString();
      router.push(search ? `${pathname}?${search}` : pathname);
    },
    [pathname, router],
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (query) next.set("q", query);
      else next.delete("q");
      if ((params.get("q") ?? "") !== query) push(next);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, params, push]);

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <label htmlFor="list-search" className="sr-only">
          Search
        </label>
        <input
          id="list-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-md border border-line-strong bg-surface pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {statuses?.length ? (
        <div className="sm:w-56">
          <label htmlFor="list-status" className="sr-only">
            Filter by status
          </label>
          <Select
            id="list-status"
            value={params.get("status") ?? ""}
            onChange={(event) => {
              const next = new URLSearchParams(params.toString());
              if (event.target.value) next.set("status", event.target.value);
              else next.delete("status");
              push(next);
            }}
          >
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
    </div>
  );
}
