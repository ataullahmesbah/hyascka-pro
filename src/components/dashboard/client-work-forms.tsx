"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Upload } from "lucide-react";

import { ActionForm, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { AttachmentPicker } from "@/components/dashboard/request-thread";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createProjectAction, shareClientDocumentAction } from "@/actions/projects";
import type { Attachment } from "@/lib/attachments";

const CURRENCIES = ["USD", "BDT", "EUR", "GBP"];

/** Staff starting a project, so the client's Projects page has something in it. */
export function CreateProjectForm({
  clients,
  services,
  requests,
}: {
  clients: { id: string; label: string }[];
  services: { id: string; title: string }[];
  requests: { id: string; label: string; clientId: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [clientId, setClientId] = React.useState("");

  // Only the chosen client's requests: a project cannot come from someone
  // else's request, and offering them would only invite the mistake.
  const clientRequests = requests.filter((request) => request.clientId === clientId);

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen((value) => !value)}>
        <FolderPlus className="h-4 w-4" />
        {open ? "Close" : "New project"}
      </Button>

      {open ? (
        <div className="mt-4 rounded-lg border border-accent-border bg-accent-soft/40 p-4">
          <ActionForm
            action={async (state, formData) => {
              const result = await createProjectAction(state, formData);
              if (result.ok) {
                setOpen(false);
                router.refresh();
              }
              return result;
            }}
            successTitle="Project created"
            resetOnSuccess
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ProjectClientField clients={clients} value={clientId} onChange={setClientId} />

              <Field
                label="From request"
                htmlFor="pr-request"
                hint={clientId ? "Optional — marks it converted." : "Choose a client first."}
              >
                <Select id="pr-request" name="requestId" disabled={!clientRequests.length}>
                  <option value="">Not from a request</option>
                  {clientRequests.map((request) => (
                    <option key={request.id} value={request.id}>
                      {request.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <ProjectNameField />

            <Field label="Summary" htmlFor="pr-summary" hint="The client reads this.">
              <Textarea id="pr-summary" name="summary" rows={3} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Service" htmlFor="pr-service">
                <Select id="pr-service" name="serviceId">
                  <option value="">None</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Budget" htmlFor="pr-budget">
                <Input id="pr-budget" name="budget" type="number" min={0} step="0.01" />
              </Field>
              <Field label="Currency" htmlFor="pr-currency">
                <Select id="pr-currency" name="currency" defaultValue="USD">
                  {CURRENCIES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Target date" htmlFor="pr-due">
              <Input id="pr-due" name="dueDate" type="date" />
            </Field>

            <SubmitButton>Create project</SubmitButton>
          </ActionForm>
        </div>
      ) : null}
    </div>
  );
}

/** Staff putting a contract or report in front of a client. */
export function ShareDocumentForm({ clients }: { clients: { id: string; label: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState<Attachment[]>([]);

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen((value) => !value)}>
        <Upload className="h-4 w-4" />
        {open ? "Close" : "Share a document"}
      </Button>

      {open ? (
        <div className="mt-4 rounded-lg border border-accent-border bg-accent-soft/40 p-4">
          <ActionForm
            action={async (state, formData) => {
              formData.set("attachments", JSON.stringify(files));
              const result = await shareClientDocumentAction(state, formData);
              if (result.ok) {
                setFiles([]);
                setOpen(false);
                router.refresh();
              }
              return result;
            }}
            successTitle="Shared"
            resetOnSuccess
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <DocumentClientField clients={clients} />
              <Field label="Category" htmlFor="doc-category">
                <Select id="doc-category" name="category" defaultValue="CONTRACT">
                  {["CONTRACT", "PROPOSAL", "REPORT", "BRIEF", "OTHER"].map((value) => (
                    <option key={value} value={value}>
                      {value.charAt(0) + value.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <DocumentTitleField />

            <div>
              <p className="mb-2 text-step--2 font-medium text-ink-soft">File</p>
              <AttachmentPicker files={files} onChange={setFiles} />
            </div>

            <SubmitButton className="mt-4">Share with the client</SubmitButton>
          </ActionForm>
        </div>
      ) : null}
    </div>
  );
}

function ProjectClientField({
  clients,
  value,
  onChange,
}: {
  clients: { id: string; label: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <Field label="Client" htmlFor="pr-client" required error={useFieldError("clientId")}>
      <Select
        id="pr-client"
        name="clientId"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Choose a client…</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function ProjectNameField() {
  return (
    <Field label="Project name" htmlFor="pr-name" required error={useFieldError("name")}>
      <Input id="pr-name" name="name" required placeholder="Checkout rebuild — phase 1" />
    </Field>
  );
}

function DocumentClientField({ clients }: { clients: { id: string; label: string }[] }) {
  return (
    <Field label="Client" htmlFor="doc-client" required error={useFieldError("clientId")}>
      <Select id="doc-client" name="clientId" required defaultValue="">
        <option value="">Choose a client…</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function DocumentTitleField() {
  return (
    <Field label="Title" htmlFor="doc-title" required error={useFieldError("title")}>
      <Input id="doc-title" name="title" required placeholder="Statement of work — Q4" />
    </Field>
  );
}
