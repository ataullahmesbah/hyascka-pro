import * as React from "react";

import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-surface-2 text-ink-soft border-line",
  accent: "bg-accent-soft text-accent border-transparent",
  success: "bg-success-soft text-success border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  info: "bg-info-soft text-info border-transparent",
  outline: "bg-transparent text-ink-muted border-line",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-step--2 font-semibold",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Every workflow status in the product maps to one consistent tone. */
const STATUS_TONES: Record<string, BadgeTone> = {
  PUBLISHED: "success", DRAFT: "neutral", ARCHIVED: "neutral", FEATURED: "accent",
  ACTIVE: "success", SUSPENDED: "danger", DISABLED: "neutral", PENDING_VERIFICATION: "warning",
  NEW: "info", CONTACTED: "accent", QUALIFIED: "accent", PROPOSAL_SENT: "warning",
  WON: "success", LOST: "danger",
  PLANNING: "info", IN_PROGRESS: "accent", REVIEW: "warning", ON_HOLD: "warning",
  COMPLETED: "success", CANCELLED: "danger", TODO: "neutral", DONE: "success",
  BLOCKED: "danger", PENDING: "neutral",
  ISSUED: "info", PARTIALLY_PAID: "warning", PAID: "success", OVERDUE: "danger", VOID: "neutral",
  VERIFIED: "success", REJECTED: "danger", REFUNDED: "warning", SUBMITTED: "info", APPROVED: "success",
  OPEN: "info", RESOLVED: "success", CLOSED: "neutral",
  IN_REVIEW: "info", OFFER_SENT: "warning", ACCEPTED: "accent", CONVERTED: "accent",
  DELIVERED: "success",
  LOW: "neutral", MEDIUM: "info", HIGH: "warning", URGENT: "danger",
  GOOD: "success", THIN: "warning", MISSING: "danger", "TOO LONG": "warning",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={STATUS_TONES[status.toUpperCase()] ?? "neutral"} className={className}>
      {status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
    </Badge>
  );
}
