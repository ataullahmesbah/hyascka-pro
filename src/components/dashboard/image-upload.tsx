"use client";

import * as React from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";

import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UPLOAD_LIMITS } from "@/lib/upload-limits";

/**
 * Image field with upload (PRD §6.7).
 *
 * The value is always a plain URL, so an editor can paste one instead of
 * uploading. The limits and the recommended dimensions are printed next to the
 * control rather than left for someone to discover through an error.
 */
export function ImageUpload({
  name,
  label,
  value,
  onChange,
  guidance,
  folder = "hyascka",
  className,
}: {
  name?: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  guidance?: string;
  folder?: string;
  className?: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const id = React.useId();

  const upload = async (file: File) => {
    setError(null);

    if (file.size > UPLOAD_LIMITS.image.maxBytes) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${UPLOAD_LIMITS.image.label}.`);
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      const response = await fetch("/api/media/upload", { method: "POST", body });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Upload failed.");
      } else {
        onChange(data.url);
      }
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field
      label={label}
      htmlFor={`${id}-url`}
      hint={`${UPLOAD_LIMITS.image.hint}${guidance ? ` · recommended ${guidance}` : ""}`}
      error={error ?? undefined}
      className={className}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-2",
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-5 w-5 text-ink-muted" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <Input
            id={`${id}-url`}
            name={name}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste a URL, or upload →"
          />
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={UPLOAD_LIMITS.image.accept}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {busy ? "Uploading…" : "Upload"}
            </Button>
            {value ? (
              <Button variant="ghost" size="sm" onClick={() => onChange("")}>
                <X className="h-4 w-4" />
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Field>
  );
}
