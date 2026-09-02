"use client";

import * as React from "react";
import { Info, ShieldCheck } from "lucide-react";

import { submitPaymentAction } from "@/actions/finance";
import { ActionForm, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { Field, Input, Select } from "@/components/ui/field";
import { formatCurrency } from "@/lib/utils";
import { trackEvent } from "@/components/marketing/tracking";

export type ActiveMethod = {
  method: string;
  label: string;
  accountName: string | null;
  accountNumber: string | null;
  branch: string | null;
  instructions: string | null;
  minAmount: number | null;
  maxAmount: number | null;
};

/**
 * Manual payment submission (PRD §43.2). The client sends money out-of-band and
 * submits the transaction ID here; nothing is treated as paid until finance
 * verifies it.
 */
export function PaymentSubmission({
  invoiceId,
  outstanding,
  currency,
  methods,
}: {
  invoiceId: string;
  outstanding: number;
  currency: string;
  methods: ActiveMethod[];
}) {
  const [selected, setSelected] = React.useState(methods[0]?.method ?? "");
  const method = methods.find((item) => item.method === selected) ?? methods[0];

  return (
    <ActionForm
      action={async (state, formData) => {
        const result = await submitPaymentAction(state, formData);
        if (result.ok) trackEvent("payment_submitted", { method: selected });
        return result;
      }}
      successTitle="Payment submitted"
    >
      <input type="hidden" name="invoiceId" value={invoiceId} />

      <Field label="Payment method" htmlFor="method" error={useFieldError("method")}>
        <Select
          id="method"
          name="method"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          {methods.map((item) => (
            <option key={item.method} value={item.method}>
              {item.label}
            </option>
          ))}
        </Select>
      </Field>

      {method ? (
        <div className="rounded-lg border border-line bg-surface-2/60 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Info className="h-4 w-4 text-accent" />
            Send to
          </p>
          <dl className="mt-2.5 space-y-1.5 text-sm">
            {method.accountName ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Account name</dt>
                <dd className="text-right font-medium">{method.accountName}</dd>
              </div>
            ) : null}
            {method.accountNumber ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Number</dt>
                <dd className="text-right font-mono font-medium">{method.accountNumber}</dd>
              </div>
            ) : null}
            {method.branch ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Branch</dt>
                <dd className="text-right">{method.branch}</dd>
              </div>
            ) : null}
          </dl>
          {method.instructions ? (
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">{method.instructions}</p>
          ) : null}
        </div>
      ) : null}

      <AmountField outstanding={outstanding} currency={currency} />
      <TrxField />
      <SenderField />
      <ProofField />

      <SubmitButton className="w-full" pendingLabel="Submitting…">
        Submit payment for verification
      </SubmitButton>

      <p className="flex items-start gap-2 text-xs text-ink-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
        Submitting records the payment as pending. Our finance team verifies it against our statement
        before the invoice is marked paid — you will be notified either way.
      </p>
    </ActionForm>
  );
}

function AmountField({ outstanding, currency }: { outstanding: number; currency: string }) {
  return (
    <Field
      label="Amount paid"
      htmlFor="amount"
      required
      hint={`Outstanding balance: ${formatCurrency(outstanding, currency)}`}
      error={useFieldError("amount")}
    >
      <Input
        id="amount"
        name="amount"
        type="number"
        step="0.01"
        min={0}
        max={outstanding}
        defaultValue={outstanding}
        required
      />
    </Field>
  );
}

function TrxField() {
  return (
    <Field
      label="Transaction ID"
      htmlFor="trxId"
      required
      hint="The TrxID from your confirmation SMS or app. Each ID can only be submitted once."
      error={useFieldError("trxId")}
    >
      <Input id="trxId" name="trxId" required placeholder="8N7A2B9C1D" className="font-mono" />
    </Field>
  );
}

function SenderField() {
  return (
    <Field label="Sending number / account" htmlFor="senderNumber" error={useFieldError("senderNumber")}>
      <Input id="senderNumber" name="senderNumber" placeholder="01700-000000" />
    </Field>
  );
}

function ProofField() {
  return (
    <Field
      label="Receipt link"
      htmlFor="proofUrl"
      hint="Optional. A link to a screenshot speeds up verification."
      error={useFieldError("proofUrl")}
    >
      <Input id="proofUrl" name="proofUrl" type="url" placeholder="https://…" />
    </Field>
  );
}
