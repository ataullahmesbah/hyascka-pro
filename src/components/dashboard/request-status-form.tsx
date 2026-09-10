"use client";

import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { setRequestStatusAction } from "@/actions/requests";

const STATUSES = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "OFFER_SENT", label: "Offer sent" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "IN_PROGRESS", label: "Working on it" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CLOSED", label: "Closed — signed off" },
  { value: "CONVERTED", label: "Converted to a project" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

/** Staff control for where a request stands; the client sees the result. */
export function RequestStatusForm({
  requestId,
  status,
  progress,
}: {
  requestId: string;
  status: string;
  progress: number;
}) {
  return (
    <ActionForm action={setRequestStatusAction} successTitle="Status updated">
      <input type="hidden" name="requestId" value={requestId} />
      <Field label="Status" htmlFor={`status-${requestId}`}>
        <Select id={`status-${requestId}`} name="status" defaultValue={status}>
          {STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Progress (%)"
        htmlFor={`progress-${requestId}`}
        hint="Shown to the client as a bar."
      >
        <Input
          id={`progress-${requestId}`}
          name="progress"
          type="number"
          min={0}
          max={100}
          defaultValue={String(progress)}
        />
      </Field>
      <Field label="Note to the client" htmlFor={`note-${requestId}`}>
        <Textarea id={`note-${requestId}`} name="note" rows={3} placeholder="Optional" />
      </Field>
      <SubmitButton>Update status</SubmitButton>
    </ActionForm>
  );
}
