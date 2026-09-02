"use client";

import * as React from "react";

import { ButtonLink } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { formatCurrency } from "@/lib/utils";
import { trackEvent } from "@/components/marketing/tracking";

/**
 * Interactive estimate calculator to pre-qualify leads (PRD §48.1).
 * Deliberately produces a *range* and says so — a fake exact number would be
 * a claim we cannot stand behind (PRD §7, no fake claims).
 */
const SCOPE = [
  { value: "small", label: "Focused — a few key pages or one workflow", multiplier: 1 },
  { value: "medium", label: "Standard — full site or a complete channel", multiplier: 1.9 },
  { value: "large", label: "Complex — platform, portal or multi-channel", multiplier: 3.4 },
];

const TIMELINE = [
  { value: "flexible", label: "Flexible — best value", multiplier: 1 },
  { value: "normal", label: "Standard — agreed schedule", multiplier: 1.15 },
  { value: "urgent", label: "Compressed — priority capacity", multiplier: 1.45 },
];

const BASE = 180000;

export function QuoteCalculator({
  serviceTitle,
  serviceSlug,
  currency,
}: {
  serviceTitle: string;
  serviceSlug: string;
  currency: string;
}) {
  const [scope, setScope] = React.useState(SCOPE[1].value);
  const [timeline, setTimeline] = React.useState(TIMELINE[1].value);

  const estimate = React.useMemo(() => {
    const s = SCOPE.find((item) => item.value === scope)?.multiplier ?? 1;
    const t = TIMELINE.find((item) => item.value === timeline)?.multiplier ?? 1;
    const mid = BASE * s * t;
    return { low: Math.round((mid * 0.82) / 5000) * 5000, high: Math.round((mid * 1.25) / 5000) * 5000 };
  }, [scope, timeline]);

  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider">Estimate range</h2>
      <p className="mt-2 text-xs text-ink-muted">
        An indicative range for {serviceTitle.toLowerCase()}, not a quotation. Your proposal is priced
        after a discovery call.
      </p>

      <div className="mt-4 space-y-3">
        <Field label="Scope" htmlFor="qc-scope">
          <Select id="qc-scope" value={scope} onChange={(event) => setScope(event.target.value)}>
            {SCOPE.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Timeline" htmlFor="qc-timeline">
          <Select id="qc-timeline" value={timeline} onChange={(event) => setTimeline(event.target.value)}>
            {TIMELINE.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <p className="accent-text mt-5 font-display text-2xl font-extrabold">
        {formatCurrency(estimate.low, currency)} – {formatCurrency(estimate.high, currency)}
      </p>

      <ButtonLink
        href={`/contact?service=${serviceSlug}&budget=${estimate.low}-${estimate.high}`}
        size="sm"
        className="mt-4 w-full"
        onClick={() => trackEvent("quote_request", { service: serviceSlug })}
      >
        Get an exact proposal
      </ButtonLink>
    </div>
  );
}
