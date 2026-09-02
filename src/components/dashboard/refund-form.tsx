"use client";

import * as React from "react";

import { createRefundAction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function RefundForm({
  payments,
}: {
  payments: { id: string; label: string; max: number }[];
}) {
  const [paymentId, setPaymentId] = React.useState(payments[0]?.id ?? "");
  const [amount, setAmount] = React.useState(payments[0]?.max ?? 0);
  const [reason, setReason] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  if (!payments.length) {
    return <p className="text-sm text-ink-muted">There are no verified payments to refund.</p>;
  }

  const selected = payments.find((payment) => payment.id === paymentId);

  return (
    <div className="space-y-5">
      <Field label="Payment" htmlFor="refund-payment">
        <Select
          id="refund-payment"
          value={paymentId}
          onChange={(event) => {
            setPaymentId(event.target.value);
            setAmount(payments.find((p) => p.id === event.target.value)?.max ?? 0);
          }}
        >
          {payments.map((payment) => (
            <option key={payment.id} value={payment.id}>
              {payment.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Refund amount"
        htmlFor="refund-amount"
        hint={selected ? `Maximum ${selected.max}` : undefined}
      >
        <Input
          id="refund-amount"
          type="number"
          min={0}
          max={selected?.max}
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
      </Field>

      <Field label="Reason" htmlFor="refund-reason" required hint="Written to the audit log.">
        <Textarea
          id="refund-reason"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Scope reduced by agreement — milestone 2 not started."
        />
      </Field>

      <Button
        variant="danger"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            if (reason.trim().length < 5) {
              toast({ kind: "error", title: "Reason required", description: "Explain why this refund is being raised." });
              return;
            }
            try {
              await createRefundAction(paymentId, amount, reason.trim());
              toast({ kind: "success", title: "Refund raised", description: "A reversing ledger entry has been created." });
              setReason("");
            } catch (error) {
              toast({
                kind: "error",
                title: "Could not raise refund",
                description: error instanceof Error ? error.message : "Unexpected error.",
              });
            }
          })
        }
      >
        Raise refund
      </Button>
    </div>
  );
}
