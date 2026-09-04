import { z } from "zod";

import { UPLOAD_LIMITS } from "@/lib/upload-limits";

/**
 * Files hung off a service request or one of its updates.
 *
 * Stored as JSON on the row rather than in their own table: they are always
 * read with their parent, never queried on their own, and never joined. The
 * shape is validated on the way in so a malformed blob cannot reach the UI.
 */
export const attachmentSchema = z.object({
  url: z.string().trim().min(1).max(2000),
  name: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(3).max(120),
  sizeBytes: z.coerce.number().int().min(0).max(20 * 1024 * 1024),
});

export type Attachment = z.infer<typeof attachmentSchema>;

/** At most five files per message — enough for a brief, short of an upload dump. */
export const attachmentsSchema = z.array(attachmentSchema).max(5).default([]);

export const ALLOWED_ATTACHMENT_TYPES = [
  ...UPLOAD_LIMITS.image.types,
  ...UPLOAD_LIMITS.document.types,
] as const;

export const ATTACHMENT_HINT = `Images (JPG, PNG, WebP, AVIF, SVG) up to ${UPLOAD_LIMITS.image.label}, or PDF up to ${UPLOAD_LIMITS.document.label}. Five files per message.`;

export const ATTACHMENT_ACCEPT = `${UPLOAD_LIMITS.image.accept},${UPLOAD_LIMITS.document.accept}`;

/** Parses a JSON column back into attachments, dropping anything malformed. */
export function readAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = attachmentSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}
