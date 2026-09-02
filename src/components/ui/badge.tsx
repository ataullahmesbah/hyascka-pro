import * as React from "react";

import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/12 text-danger",
  info: "bg-info/12 text-info",
  outline: "border border-border text-muted-foreground",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Maps every workflow status in the platform to a consistent colour. */
const STATUS_TONES: Record<string, BadgeTone> = {
  // Content / generic
  PUBLISHED: "success", DRAFT: "neutral", ARCHIVED: "neutral",
  ACTIVE: "success", SUSPENDED: "danger", DISABLED: "neutral", PENDING_VERIFICATION: "warning",
  // Leads
  NEW: "info", CONTACTED: "primary", QUALIFIED: "primary", PROPOSAL_SENT: "warning", WON: "success", LOST: "danger",
  // Projects / tasks
  PLANNING: "info", IN_PROGRESS: "primary", REVIEW: "warning", ON_HOLD: "warning",
  COMPLETED: "success", CANCELLED: "danger", TODO: "neutral", DONE: "success", BLOCKED: "danger", PENDING: "neutral",
  // Finance
  ISSUED: "info", PARTIALLY_PAID: "warning", PAID: "success", OVERDUE: "danger", VOID: "neutral",
  VERIFIED: "success", REJECTED: "danger", REFUNDED: "warning", SUBMITTED: "info", APPROVED: "success",
  // Support
  OPEN: "info", RESOLVED: "success", CLOSED: "neutral",
  // Priority
  LOW: "neutral", MEDIUM: "info", HIGH: "warning", URGENT: "danger",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={STATUS_TONES[status] ?? "neutral"} className={className}>
      {status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
    </Badge>
  );
}
