"use client";

import * as React from "react";
import { FileSpreadsheet, FileText } from "lucide-react";

import { ButtonAnchor } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { REPORT_LABELS, REPORT_PERIODS, REPORT_TYPES } from "@/lib/reports/shared";

/**
 * Report picker (PRD §6.3). Downloads are plain links so the browser handles
 * the file the way it normally would — no blob juggling, no lost filename.
 */
export function ReportGenerator() {
  const [type, setType] = React.useState<string>(REPORT_TYPES[0]);
  const [period, setPeriod] = React.useState<string>("monthly");

  const href = (format: "pdf" | "xlsx") =>
    `/api/reports/generate?type=${type}&period=${period}&format=${format}`;

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field label="Report" htmlFor="report-type">
        <Select id="report-type" value={type} onChange={(event) => setType(event.target.value)}>
          {REPORT_TYPES.map((value) => (
            <option key={value} value={value}>
              {REPORT_LABELS[value]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Period" htmlFor="report-period">
        <Select id="report-period" value={period} onChange={(event) => setPeriod(event.target.value)}>
          {REPORT_PERIODS.map((value) => (
            <option key={value} value={value}>
              {value.replace(/^\w/, (c) => c.toUpperCase())}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex gap-2">
        <ButtonAnchor href={href("pdf")} variant="outline" download>
          <FileText className="h-4 w-4" />
          PDF
        </ButtonAnchor>
        <ButtonAnchor href={href("xlsx")} download>
          <FileSpreadsheet className="h-4 w-4" />
          Excel
        </ButtonAnchor>
      </div>
    </div>
  );
}
