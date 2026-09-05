"use client";

import * as React from "react";

import {
  assignTicketAction,
  createStaffTicketAction,
  createTicketAction,
  replyToTicketAction,
  setTicketStatusAction,
} from "@/actions/messages";
import { ActionForm, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { ActionForm as Form } from "@/components/dashboard/action-form";
import { useToast } from "@/components/ui/toast";

const CATEGORIES = ["GENERAL", "BILLING", "TECHNICAL", "ACCOUNT", "FEEDBACK"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES = ["OPEN", "PENDING", "RESOLVED", "CLOSED"] as const;

export function TicketForm({
  requestId,
  projectId,
  aboutTitle,
  requestTitle,
}: {
  /** Set when the ticket is raised from a service, so staff know which one. */
  requestId?: string;
  /** Or from a project, for work already under way. */
  projectId?: string;
  aboutTitle?: string;
  requestTitle?: string;
} = {}) {
  const about = aboutTitle ?? requestTitle;
  return (
    <ActionForm action={createTicketAction} successTitle="Ticket opened" resetOnSuccess>
      {requestId ? <input type="hidden" name="requestId" value={requestId} /> : null}
      {projectId ? <input type="hidden" name="projectId" value={projectId} /> : null}
      {about ? (
        <p className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-step--2 text-ink-soft">
          About <strong className="text-ink">{about}</strong>
        </p>
      ) : null}
      <SubjectField />
      <CategoryField />
      <PriorityField />
      <BodyField />
      <SubmitButton className="w-full">Open ticket</SubmitButton>
    </ActionForm>
  );
}

function SubjectField() {
  return (
    <Field label="Subject" htmlFor="subject" required error={useFieldError("subject")}>
      <Input id="subject" name="subject" required placeholder="Add a second user to our account" />
    </Field>
  );
}

function CategoryField() {
  return (
    <Field label="Category" htmlFor="category" error={useFieldError("category")}>
      <Select id="category" name="category" defaultValue="GENERAL">
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function PriorityField() {
  return (
    <Field label="Priority" htmlFor="priority" error={useFieldError("priority")}>
      <Select id="priority" name="priority" defaultValue="MEDIUM">
        {PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {priority.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function BodyField() {
  return (
    <Field label="Describe the issue" htmlFor="body" required error={useFieldError("body")}>
      <Textarea id="body" name="body" rows={5} required placeholder="What is happening, and what did you expect?" />
    </Field>
  );
}

export function TicketReply({ ticketId, canPostInternal }: { ticketId: string; canPostInternal: boolean }) {
  return (
    <ActionForm action={replyToTicketAction} successTitle="Reply sent" resetOnSuccess>
      <input type="hidden" name="ticketId" value={ticketId} />
      <Field label="Reply" htmlFor="reply-body">
        <Textarea id="reply-body" name="body" rows={4} required placeholder="Write your reply…" />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canPostInternal ? (
          <label className="flex items-center gap-2.5 text-sm text-ink-muted">
            <Checkbox name="isInternal" />
            Internal note (staff only)
          </label>
        ) : (
          <span />
        )}
        <SubmitButton pendingLabel="Sending…">Send reply</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function TicketStatusControl({ ticketId, status }: { ticketId: string; status: string }) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  return (
    <Field label="Ticket status" htmlFor="ticket-status">
      <Select
        id="ticket-status"
        defaultValue={status}
        disabled={pending}
        onChange={(event) =>
          startTransition(async () => {
            await setTicketStatusAction(ticketId, event.target.value as (typeof STATUSES)[number]);
            toast({ kind: "success", title: "Status updated" });
          })
        }
      >
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {value.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
          </option>
        ))}
      </Select>
    </Field>
  );
}


export type StaffOption = { id: string; name: string; roleLabel: string };
export type ClientOption = { id: string; label: string };

/**
 * Staff-raised ticket (PRD §6.4). Leaving the client blank files it as an
 * internal token — the team tracking its own work rather than a client request.
 */
export function StaffTicketForm({
  staff,
  clients,
}: {
  staff: StaffOption[];
  clients: ClientOption[];
}) {
  return (
    <Form action={createStaffTicketAction} successTitle="Ticket created" resetOnSuccess>
      <SubjectField />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client" htmlFor="clientId" hint="Leave blank for an internal token." error={useFieldError("clientId")}>
          <Select id="clientId" name="clientId" defaultValue="">
            <option value="">Internal — no client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Assign to" htmlFor="assigneeId" error={useFieldError("assigneeId")}>
          <Select id="assigneeId" name="assigneeId" defaultValue="">
            <option value="">Unassigned</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} — {member.roleLabel}
              </option>
            ))}
          </Select>
        </Field>
        <CategoryField />
        <PriorityField />
      </div>
      <BodyField />
      <SubmitButton className="w-full">Create ticket</SubmitButton>
    </Form>
  );
}

/** Reassign an open ticket to someone else on the team. */
export function TicketAssign({
  ticketId,
  staff,
  currentAssigneeId,
}: {
  ticketId: string;
  staff: StaffOption[];
  currentAssigneeId: string | null;
}) {
  return (
    <Form action={assignTicketAction} successTitle="Ticket assigned">
      <input type="hidden" name="ticketId" value={ticketId} />
      <Field
        label="Assigned to"
        htmlFor="assign-to"
        hint="The new assignee is notified and the change is written to the thread."
        error={useFieldError("assigneeId")}
      >
        <Select id="assign-to" name="assigneeId" defaultValue={currentAssigneeId ?? ""}>
          <option value="">Unassigned</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} — {member.roleLabel}
            </option>
          ))}
        </Select>
      </Field>
      <SubmitButton className="w-full">Reassign</SubmitButton>
    </Form>
  );
}
