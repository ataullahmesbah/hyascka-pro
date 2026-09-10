"use client";

import * as React from "react";
import { FileText, Loader2, Paperclip, X } from "lucide-react";

import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Textarea } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/badge";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_HINT,
  type Attachment,
} from "@/lib/attachments";
import { UPLOAD_LIMITS } from "@/lib/upload-limits";
import { postRequestUpdateAction } from "@/actions/requests";
import { cn } from "@/lib/utils";

export type ThreadEntry = {
  id: string;
  body: string;
  kind: string;
  internal: boolean;
  createdAt: string;
  authorName: string;
  authorIsStaff: boolean;
  attachments: Attachment[];
};

function AttachmentChip({ file }: { file: Attachment }) {
  const isImage = file.mimeType.startsWith("image/");
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-btn border border-line bg-surface-2 px-2.5 py-1.5 text-step--2 text-ink-soft transition-colors hover:border-accent-border hover:text-ink"
    >
      {isImage ? <Paperclip className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
      <span className="max-w-[14rem] truncate">{file.name}</span>
      <span className="text-ink-muted">{Math.max(1, Math.round(file.sizeBytes / 1024))} KB</span>
    </a>
  );
}

/** Upload control shared by both sides of the thread, and by the request form. */
export function AttachmentPicker({
  files,
  onChange,
}: {
  files: Attachment[];
  onChange: (next: Attachment[]) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const upload = async (list: FileList) => {
    setError(null);
    const picked = [...list].slice(0, 5 - files.length);
    if (!picked.length) return;

    setBusy(true);
    const added: Attachment[] = [];
    try {
      for (const file of picked) {
        const isImage = file.type.startsWith("image/");
        const limit = isImage ? UPLOAD_LIMITS.image : UPLOAD_LIMITS.document;
        if (!(limit.types as readonly string[]).includes(file.type)) {
          setError(`${file.name} is not a supported type.`);
          continue;
        }
        if (file.size > limit.maxBytes) {
          setError(`${file.name} is over the ${limit.label} limit.`);
          continue;
        }

        const body = new FormData();
        body.append("file", file);
        body.append("folder", "hyascka/requests");
        const response = await fetch("/api/media/upload", { method: "POST", body });
        if (!response.ok) {
          setError(`${file.name} could not be uploaded.`);
          continue;
        }
        const data = (await response.json()) as { url: string };
        added.push({
          url: data.url,
          name: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        });
      }
      if (added.length) onChange([...files, ...added]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ATTACHMENT_ACCEPT}
        className="sr-only"
        onChange={(event) => event.target.files && upload(event.target.files)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || files.length >= 5}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          {busy ? "Uploading…" : "Attach files"}
        </Button>
        {files.map((file) => (
          <span
            key={file.url}
            className="inline-flex items-center gap-1.5 rounded-btn border border-line bg-surface-2 px-2.5 py-1.5 text-step--2"
          >
            <span className="max-w-[12rem] truncate">{file.name}</span>
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
              onClick={() => onChange(files.filter((item) => item.url !== file.url))}
              className="text-ink-muted transition-colors hover:text-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <p className="mt-2 text-step--2 text-ink-muted">{ATTACHMENT_HINT}</p>
      {error ? <p className="mt-1 text-step--2 text-danger">{error}</p> : null}
    </div>
  );
}

/**
 * The conversation on a service request.
 *
 * The same component serves staff and the client — the only difference is that
 * staff may mark a note internal, and internal notes are filtered out on the
 * server before they ever reach a client's page.
 */
export function RequestThread({
  requestId,
  entries,
  canPostInternal = false,
  placeholder = "Write a reply…",
  readOnly = false,
  readOnlyNote,
}: {
  requestId: string;
  entries: ThreadEntry[];
  canPostInternal?: boolean;
  placeholder?: string;
  /** Closed work keeps its thread as a record, but nobody adds to it. */
  readOnly?: boolean;
  readOnlyNote?: string;
}) {
  const [files, setFiles] = React.useState<Attachment[]>([]);

  return (
    <div className="space-y-5">
      <ol className="space-y-3">
        {entries.length === 0 ? (
          <li className="rounded-lg border border-dashed border-line p-6 text-center text-step--1 text-ink-muted">
            Nothing here yet. Anything either side writes will show up here.
          </li>
        ) : null}

        {entries.map((entry) => (
          <li
            key={entry.id}
            className={cn(
              "rounded-lg border p-4",
              entry.internal
                ? "border-warning/40 bg-warning-soft"
                : entry.authorIsStaff
                  ? "border-accent-border bg-accent-soft/40"
                  : "border-line bg-surface",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-step--1 font-semibold text-ink">{entry.authorName}</span>
              {entry.kind !== "NOTE" ? <StatusBadge status={entry.kind} /> : null}
              {entry.internal ? (
                <span className="rounded-pill bg-warning/20 px-2 py-0.5 text-step--2 font-medium text-warning">
                  Internal — not shown to the client
                </span>
              ) : null}
              <span className="ml-auto text-step--2 text-ink-muted">{entry.createdAt}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-step--1 leading-relaxed text-ink-soft">
              {entry.body}
            </p>
            {entry.attachments.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.attachments.map((file) => (
                  <AttachmentChip key={file.url} file={file} />
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {readOnly ? (
        <p className="rounded-lg border border-line bg-surface-2 p-4 text-center text-step--1 text-ink-soft">
          {readOnlyNote ?? "This conversation is closed."}
        </p>
      ) : (
      <ActionForm action={postRequestUpdateAction} successTitle="Sent" resetOnSuccess>
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="attachments" value={JSON.stringify(files)} />
        <Field label="Reply" htmlFor={`reply-${requestId}`}>
          <Textarea id={`reply-${requestId}`} name="body" rows={4} placeholder={placeholder} required />
        </Field>
        <AttachmentPicker files={files} onChange={setFiles} />
        {canPostInternal ? (
          <label className="flex items-center gap-2.5 text-step--1">
            <Checkbox name="internal" />
            Internal note — the client will not see this
          </label>
        ) : null}
        <SubmitButton>Send</SubmitButton>
      </ActionForm>
      )}
    </div>
  );
}
