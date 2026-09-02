import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { buildPdf } from "@/lib/reports/pdf";
import { buildXlsx } from "@/lib/reports/xlsx";
import {
  REPORT_PERIODS,
  REPORT_TYPES,
  buildReport,
  toSheets,
  type ReportPeriod,
  type ReportType,
} from "@/lib/reports/build";

/**
 * Report generation (PRD §6.3). Authorisation is checked here exactly as on any
 * other private route — a download URL is not a bypass.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actor = {
    id: user.id,
    role: user.role,
    extraPermissions: user.extraPermissions,
    revokedPermissions: user.revokedPermissions,
  };
  if (!can(actor, "reports.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const type = params.get("type") as ReportType;
  const period = params.get("period") as ReportPeriod;
  const format = params.get("format") === "xlsx" ? "xlsx" : "pdf";

  if (!REPORT_TYPES.includes(type) || !REPORT_PERIODS.includes(period)) {
    return NextResponse.json({ error: "Unknown report." }, { status: 400 });
  }

  const report = await buildReport(type, period);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `hyascka-${type}-${period}-${stamp}.${format}`;

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "report.generated",
    entityType: "Report",
    entityId: `${type}:${period}`,
    summary: `${report.title} (${period}) exported as ${format.toUpperCase()}`,
  });

  const body =
    format === "xlsx"
      ? buildXlsx(toSheets(report))
      : buildPdf({
          title: report.title,
          subtitle: report.subtitle,
          meta: report.meta,
          tables: report.tables,
        });

  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type":
        format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(body.length),
      "Cache-Control": "no-store",
    },
  });
}
