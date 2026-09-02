"use client";

import * as React from "react";

import { convertLeadAction, updateLeadAction } from "@/actions/crm";
import { ActionForm, ConfirmButton, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { Field, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST"] as const;

export function LeadWorkflow({
  leadId,
  owners,
  lead,
}: {
  leadId: string;
  owners: { id: string; name: string }[];
  lead: { status: string; ownerId: string | null };
}) {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <ActionForm action={updateLeadAction} successTitle="Lead updated">
        <input type="hidden" name="leadId" value={leadId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <StatusField defaultValue={lead.status} />
          <OwnerField owners={owners} defaultValue={lead.ownerId ?? ""} />
        </div>
        <NoteField />
        <div className="flex flex-wrap gap-2">
          <SubmitButton>Save update</SubmitButton>
          <ConfirmButton
            label="Convert to client"
            confirmLabel="Create the account?"
            onConfirm={async () => {
              const result = await convertLeadAction(leadId);
              toast({
                kind: result.ok ? "success" : "error",
                title: result.ok ? "Client created" : "Could not convert",
                description: result.message ?? "",
              });
            }}
          />
        </div>
      </ActionForm>
    </div>
  );
}

function StatusField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Pipeline stage" htmlFor="status" error={useFieldError("status")}>
      <Select id="status" name="status" defaultValue={defaultValue}>
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function OwnerField({
  owners,
  defaultValue,
}: {
  owners: { id: string; name: string }[];
  defaultValue: string;
}) {
  return (
    <Field label="Owner" htmlFor="ownerId" error={useFieldError("ownerId")}>
      <Select id="ownerId" name="ownerId" defaultValue={defaultValue}>
        <option value="">Unassigned</option>
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.name}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function NoteField() {
  return (
    <Field
      label="Add a note"
      htmlFor="note"
      hint="Optional. Recorded against the lead with your name and the time."
      error={useFieldError("note")}
    >
      <Textarea id="note" name="note" rows={3} placeholder="Called — asked for a proposal by Friday." />
    </Field>
  );
}
