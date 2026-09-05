"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { ActionForm, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { AttachmentPicker } from "@/components/dashboard/request-thread";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createClientRequestAction } from "@/actions/requests";
import type { Attachment } from "@/lib/attachments";

/**
 * A client asking us for work, from inside their own portal.
 *
 * They either pick one of our services or describe something custom. Either
 * way it becomes a request they can track — which is the point: before this,
 * a signed-in client had nowhere to ask except the public contact form, and
 * that never reached their dashboard.
 */
export function ClientRequestForm({
  services,
}: {
  services: { id: string; title: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [custom, setCustom] = React.useState(false);
  const [files, setFiles] = React.useState<Attachment[]>([]);

  return (
    <div>
      <Button size="sm" onClick={() => setOpen((value) => !value)}>
        <Plus className="h-4 w-4" />
        {open ? "Close" : "Request a service"}
      </Button>

      {open ? (
        <div className="mt-4 rounded-lg border border-accent-border bg-accent-soft/40 p-4">
          <ActionForm
            action={async (state, formData) => {
              formData.set("attachments", JSON.stringify(files));
              const result = await createClientRequestAction(state, formData);
              if (result.ok) {
                setFiles([]);
                setOpen(false);
              }
              return result;
            }}
            successTitle="Request sent"
            resetOnSuccess
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ServiceField services={services} onCustomChange={setCustom} />
              <Field label="Budget" htmlFor="req-budget" hint="Optional — a figure or a range.">
                <Input id="req-budget" name="budget" placeholder="e.g. $2,000–$4,000" />
              </Field>
            </div>

            <TitleField custom={custom} />
            <BriefField />

            <Field label="Needed by" htmlFor="req-deadline" hint="Optional.">
              <Input id="req-deadline" name="deadline" type="date" />
            </Field>

            <div>
              <p className="mb-2 text-step--2 font-medium text-ink-soft">
                Attach anything that helps — briefs, screenshots, a PDF.
              </p>
              <AttachmentPicker files={files} onChange={setFiles} />
            </div>

            <SubmitButton className="mt-4">Send request</SubmitButton>
          </ActionForm>
        </div>
      ) : null}
    </div>
  );
}

function ServiceField({
  services,
  onCustomChange,
}: {
  services: { id: string; title: string }[];
  onCustomChange: (custom: boolean) => void;
}) {
  return (
    <Field label="What do you need?" htmlFor="req-service" error={useFieldError("serviceId")}>
      <Select
        id="req-service"
        name="serviceId"
        defaultValue=""
        onChange={(event) => onCustomChange(!event.target.value)}
      >
        {services.map((service) => (
          <option key={service.id} value={service.id}>
            {service.title}
          </option>
        ))}
        <option value="">Something else — custom work</option>
      </Select>
    </Field>
  );
}

function TitleField({ custom }: { custom: boolean }) {
  return (
    <Field label="Title" htmlFor="req-title" required error={useFieldError("title")}>
      <Input
        id="req-title"
        name="title"
        required
        placeholder={custom ? "Rebuild our booking flow" : "SEO for our new product line"}
      />
    </Field>
  );
}

function BriefField() {
  return (
    <Field
      label="Tell us what you need"
      htmlFor="req-brief"
      required
      hint="What you want, what it is for, anything we should know."
      error={useFieldError("brief")}
    >
      <Textarea id="req-brief" name="brief" rows={5} required />
    </Field>
  );
}
