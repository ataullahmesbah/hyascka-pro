import "server-only";

import { readAttachments } from "@/lib/attachments";
import type { ThreadEntry } from "@/components/dashboard/request-thread";
import { formatDate } from "@/lib/utils";

type UpdateRow = {
  id: string;
  body: string;
  kind: string;
  internal: boolean;
  createdAt: Date;
  attachments: unknown;
  author: { name: string; role: string } | null;
};

/**
 * Shapes request updates for the thread component.
 *
 * `includeInternal` is decided by the caller and applied here rather than in
 * the component, so an internal note cannot reach a client's page even if the
 * UI were changed later.
 */
export function toThreadEntries(rows: UpdateRow[], includeInternal: boolean): ThreadEntry[] {
  return rows
    .filter((row) => includeInternal || !row.internal)
    .map((row) => ({
      id: row.id,
      body: row.body,
      kind: row.kind,
      internal: row.internal,
      createdAt: formatDate(row.createdAt, true),
      authorName: row.author?.name ?? "HYASCKA",
      authorIsStaff: (row.author?.role ?? "CLIENT") !== "CLIENT",
      attachments: readAttachments(row.attachments),
    }));
}
