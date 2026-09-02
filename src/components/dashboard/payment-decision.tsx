"use client";

import * as React from "react";

import { decidePaymentAction } from "@/actions/finance";
import { ActionForm, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";

/**
 * Verify / reject controls (PRD §43.2). Rejection requires a reason, because
 * the client is shown it verbatim.
 */
export function PaymentDecision({ paymentId }: { paymentId: string }) {
  const [mode, setMode] = React.useState<"idle" | "verify" | "reject">("idle");

  if (mode === "idle") {
    return (
      <div className="flex shrink-0 gap-2">
        <Button size="sm" onClick={() => setMode("verify")}>
          Verify
        </Button>
        <Button size="sm" variant="outline" onClick={() => setMode("reject")}>
          Reject
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full sm:w-80">
      <ActionForm action={decidePaymentAction} successTitle="Decision recorded">
        <input type="hidden" name="paymentId" value={paymentId} />
        <input type="hidden" name="decision" value={mode === "verify" ? "VERIFY" : "REJECT"} />

        {mode === "reject" ? <RejectReason /> : (
          <p className="text-sm text-ink-muted">
            Confirm you have matched this transaction ID in your statement. The invoice balance and
            the ledger update together.
          </p>
        )}

        <div className="flex gap-2">
          <SubmitButton variant={mode === "verify" ? "primary" : "danger"} pendingLabel="Recording…">
            {mode === "verify" ? "Confirm verification" : "Confirm rejection"}
          </SubmitButton>
          <Button variant="ghost" size="md" onClick={() => setMode("idle")}>
            Cancel
          </Button>
        </div>
      </ActionForm>
    </div>
  );
}

function RejectReason() {
  return (
    <Field
      label="Reason for rejection"
      htmlFor="reason"
      required
      hint="The client sees this message, so be specific."
      error={useFieldError("reason")}
    >
      <Textarea
        id="reason"
        name="reason"
        rows={3}
        required
        placeholder="No matching transaction found for this TrxID in our bKash statement."
      />
    </Field>
  );
}
