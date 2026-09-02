"use client";

import * as React from "react";

import { voidInvoiceAction } from "@/actions/finance";
import { ConfirmButton } from "@/components/dashboard/action-form";
import { Field, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

/**
 * Voiding replaces deletion: financial history is never destroyed (PRD §37).
 * A reason is required because it is written to the audit log.
 */
export function InvoiceActions({ invoiceId }: { invoiceId: string }) {
  const [reason, setReason] = React.useState("");
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <Field
        label="Reason for voiding"
        htmlFor="void-reason"
        hint="Recorded in the audit log against your name."
      >
        <Textarea
          id="void-reason"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Issued in error — replaced by INV-XXXX."
        />
      </Field>
      <ConfirmButton
        variant="danger"
        label="Void invoice"
        confirmLabel="Void it permanently?"
        onConfirm={async () => {
          if (reason.trim().length < 5) {
            toast({ kind: "error", title: "Reason required", description: "Explain why this invoice is being voided." });
            return;
          }
          try {
            await voidInvoiceAction(invoiceId, reason.trim());
            toast({ kind: "success", title: "Invoice voided", description: "The record is retained and audited." });
          } catch (error) {
            toast({
              kind: "error",
              title: "Could not void",
              description: error instanceof Error ? error.message : "Unexpected error.",
            });
          }
        }}
      />
    </div>
  );
}
