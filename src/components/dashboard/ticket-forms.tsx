"use client";

import * as React from "react";

import { createTicketAction, replyToTicketAction, setTicketStatusAction } from "@/actions/messages";
import { ActionForm, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

const CATEGORIES = ["GENERAL", "BILLING", "TECHNICAL", "ACCOUNT", "FEEDBACK"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES = ["OPEN", "PENDING", "RESOLVED", "CLOSED"] as const;

export function TicketForm() {
  return (
    <ActionForm action={createTicketAction} successTitle="Ticket opened" resetOnSuccess>
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
          <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
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
