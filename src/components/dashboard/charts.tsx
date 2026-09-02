import { cn } from "@/lib/utils";

/**
 * Server-rendered SVG charts (PRD §6.2).
 *
 * No charting library reaches the bundle. Each chart is a single measure, so it
 * needs no legend; values are printed beside or beneath the marks, which means
 * nothing here is readable by colour alone and the figure doubles as its own
 * table view.
 */

export type SeriesPoint = { label: string; value: number };

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

/** Magnitude over time. Rounded data-ends, 2px gaps, baseline-anchored. */
export function BarChart({
  data,
  format = (v) => String(v),
  height = 168,
  caption,
  className,
}: {
  data: SeriesPoint[];
  format?: (value: number) => string;
  height?: number;
  caption?: string;
  className?: string;
}) {
  if (!data.length) return null;
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const peak = data.reduce((a, b) => (b.value > a.value ? b : a), data[0]);

  return (
    <figure className={cn("w-full", className)}>
      <div
        className="flex items-end gap-1.5 sm:gap-2"
        style={{ height }}
        role="img"
        aria-label={
          caption
            ? `${caption}. Highest: ${peak.label} at ${format(peak.value)}.`
            : `Chart. Highest: ${peak.label} at ${format(peak.value)}.`
        }
      >
        {data.map((point) => {
          const ratio = max ? point.value / max : 0;
          return (
            <div key={point.label} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="text-[0.6rem] font-medium text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 tabular">
                {format(point.value)}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-[4px] bg-accent transition-[height] duration-500"
                  style={{ height: `${Math.max(point.value > 0 ? 3 : 0, ratio * 100)}%` }}
                  title={`${point.label}: ${format(point.value)}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-1.5 border-t border-line pt-2 sm:gap-2">
        {data.map((point) => (
          <span
            key={point.label}
            className="min-w-0 flex-1 truncate text-center text-[0.6rem] text-ink-muted"
          >
            {point.label}
          </span>
        ))}
      </div>

      {caption ? (
        <figcaption className="mt-2 text-step--2 text-ink-muted">
          {caption} · peak {peak.label} at {format(peak.value)}
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * Composition of a whole. A stacked bar rather than a pie: easier to compare,
 * and every segment carries its own label and value.
 */
export function SplitBar({
  data,
  total,
  format = (v) => String(v),
}: {
  data: (SeriesPoint & { tone?: "accent" | "success" | "warning" | "danger" | "info" })[];
  total?: number;
  format?: (value: number) => string;
}) {
  const sum = total ?? data.reduce((acc, d) => acc + d.value, 0);
  if (sum <= 0) {
    return <p className="text-step--1 text-ink-muted">No data in this period yet.</p>;
  }

  const TONE = {
    accent: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
  } as const;

  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-pill bg-surface-2">
        {data.map((item) =>
          item.value > 0 ? (
            <div
              key={item.label}
              className={cn("h-full first:rounded-l-pill last:rounded-r-pill", TONE[item.tone ?? "accent"])}
              style={{ width: `${(item.value / sum) * 100}%` }}
              title={`${item.label}: ${format(item.value)}`}
            />
          ) : null,
        )}
      </div>

      <dl className="mt-4 space-y-2">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 text-step--1">
            <span
              className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", TONE[item.tone ?? "accent"])}
              aria-hidden
            />
            <dt className="min-w-0 flex-1 truncate text-ink-soft">{item.label}</dt>
            <dd className="font-medium text-ink tabular">{format(item.value)}</dd>
            <dd className="w-12 text-right text-step--2 text-ink-muted tabular">
              {Math.round((item.value / sum) * 100)}%
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Horizontal ranked bars — for "top N by value" lists. */
export function RankedBars({
  data,
  format = (v) => String(v),
  emptyLabel = "Nothing to show yet.",
}: {
  data: SeriesPoint[];
  format?: (value: number) => string;
  emptyLabel?: string;
}) {
  if (!data.length) return <p className="text-step--1 text-ink-muted">{emptyLabel}</p>;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="space-y-2.5">
      {data.map((point) => (
        <li key={point.label} className="grid grid-cols-[9rem_1fr_auto] items-center gap-3">
          <span className="truncate text-step--1 text-ink-soft" title={point.label}>
            {point.label}
          </span>
          <span className="h-2 rounded-pill bg-surface-2">
            <span
              className="block h-full rounded-pill bg-accent"
              style={{ width: `${Math.max(point.value > 0 ? 3 : 0, (point.value / max) * 100)}%` }}
            />
          </span>
          <span className="text-step--1 font-medium text-ink tabular">{format(point.value)}</span>
        </li>
      ))}
    </ul>
  );
}
