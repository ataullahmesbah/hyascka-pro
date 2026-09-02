export const REPORT_TYPES = ["finance", "leads", "projects", "clients"] as const;
export const REPORT_PERIODS = ["daily", "weekly", "monthly", "quarterly"] as const;

export type ReportType = (typeof REPORT_TYPES)[number];
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const REPORT_LABELS: Record<ReportType, string> = {
  finance: "Finance report",
  leads: "Lead & pipeline report",
  projects: "Delivery report",
  clients: "Client report",
};
