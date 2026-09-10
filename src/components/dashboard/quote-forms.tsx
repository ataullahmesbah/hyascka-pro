"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, Lock, X } from "lucide-react";

import {
  ActionForm,
  ConfirmButton,
  SubmitButton,
  useFieldError,
} from "@/components/dashboard/action-form";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  closeRequestAction,
  confirmRequestAction,
  quoteRequestAction,
  reopenRequestAction,
  respondToQuoteAction,
} from "@/actions/requests";
import { invoiceRequestAction } from "@/actions/finance";
import { formatCurrency } from "@/lib/utils";

const CURRENCIES = ["USD", "BDT", "EUR", "GBP"];

/** Staff side: put a price on the work, and say what it covers. */
export function QuoteForm({
  requestId,
  amount,
  currency,
  note,
}: {
  requestId: string;
  amount: number | null;
  currency: string;
  note: string | null;
}) {
  return (
    <ActionForm action={quoteRequestAction} successTitle="Quote sent">
      <input type="hidden" name="requestId" value={requestId} />
      <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
        <Field label="Amount" htmlFor={`amount-${requestId}`} required error={useFieldError("amount")}>
          <Input
            id={`amount-${requestId}`}
            name="amount"
            type="number"
            min={1}
            step="0.01"
            defaultValue={amount ?? ""}
            required
          />
        </Field>
        <Field label="Currency" htmlFor={`currency-${requestId}`}>
          <Select id={`currency-${requestId}`} name="currency" defaultValue={currency}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field
        label="What this covers"
        htmlFor={`note-${requestId}`}
        hint="The client reads this next to the price."
      >
        <Textarea id={`note-${requestId}`} name="note" rows={3} defaultValue={note ?? ""} />
      </Field>
      <SubmitButton>{amount ? "Re-quote" : "Send quote"}</SubmitButton>
    </ActionForm>
  );
}

/** Staff side: confirm accepted work, and bill it. */
export function RequestFinanceActions({
  requestId,
  accepted,
  confirmed,
  invoiced,
}: {
  requestId: string;
  accepted: boolean;
  confirmed: boolean;
  invoiced: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-2">
      {accepted && !confirmed ? (
        <ConfirmButton
          label="Confirm and start"
          confirmLabel="Confirm this work?"
          variant="primary"
          onConfirm={async () => {
            const result = await confirmRequestAction(requestId);
            toast({
              kind: result.ok ? "success" : "error",
              title: result.ok ? "Confirmed" : "Could not confirm",
              description: result.message,
            });
            if (result.ok) router.refresh();
          }}
        />
      ) : null}

      {accepted && !invoiced ? (
        <ActionForm
          action={async (state, formData) => {
            const result = await invoiceRequestAction(state, formData);
            if (result.ok) router.refresh();
            return result;
          }}
          successTitle="Invoice issued"
        >
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="dueDays" value="14" />
          <SubmitButton variant="outline" pendingLabel="Issuing…">
            <FileText className="h-4 w-4" />
            Create invoice from quote
          </SubmitButton>
        </ActionForm>
      ) : null}
    </div>
  );
}

/** Client side: the price, and the two answers to it. */
export function QuoteDecision({
  requestId,
  amount,
  currency,
  note,
  acceptedAt,
  declinedAt,
}: {
  requestId: string;
  amount: number;
  currency: string;
  note: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
}) {
  const router = useRouter();
  const [answering, setAnswering] = React.useState<"accept" | "decline" | null>(null);

  const answered = Boolean(acceptedAt || declinedAt);

  return (
    <div>
      <p className="font-display text-2xl font-bold tabular">{formatCurrency(amount, currency)}</p>
      {note ? <p className="mt-2 text-step--1 text-ink-soft">{note}</p> : null}

      {acceptedAt ? (
        <p className="mt-4 rounded-lg border border-success/40 bg-success-soft px-3 py-2 text-step--1 text-success">
          You accepted this quote. We will confirm and get started.
        </p>
      ) : null}
      {declinedAt ? (
        <p className="mt-4 rounded-lg border border-line bg-surface-2 px-3 py-2 text-step--1 text-ink-soft">
          You declined this quote. Message us in the conversation if you want to revisit it.
        </p>
      ) : null}

      {!answered ? (
        answering ? (
          <ActionForm
            action={async (state, formData) => {
              const result = await respondToQuoteAction(state, formData);
              if (result.ok) {
                setAnswering(null);
                router.refresh();
              }
              return result;
            }}
            successTitle={answering === "accept" ? "Accepted" : "Declined"}
          >
            <input type="hidden" name="requestId" value={requestId} />
            <input type="hidden" name="decision" value={answering} />
            <Field
              label={answering === "accept" ? "Anything to add?" : "Why not?"}
              htmlFor={`decision-note-${requestId}`}
              hint="Optional, but it helps us."
            >
              <Textarea id={`decision-note-${requestId}`} name="note" rows={3} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <SubmitButton variant={answering === "accept" ? "primary" : "outline"}>
                {answering === "accept" ? "Accept quote" : "Decline quote"}
              </SubmitButton>
              <Button variant="ghost" size="sm" onClick={() => setAnswering(null)}>
                Back
              </Button>
            </div>
          </ActionForm>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setAnswering("accept")}>
              <Check className="h-4 w-4" />
              Accept
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAnswering("decline")}>
              <X className="h-4 w-4" />
              Decline
            </Button>
          </div>
        )
      ) : null}
    </div>
  );
}


/**
 * Signing a piece of work off.
 *
 * Closing is deliberately gated on delivery and 100% progress: it tells the
 * client the final check is done and nothing further is expected from them, so
 * it must not be reachable while either is still open. Reopening exists so a
 * close on the wrong request is a mistake, not a dead end.
 */
export function CloseRequestControl({
  requestId,
  progress,
  status,
  closedAt,
  closeNote,
}: {
  requestId: string;
  progress: number;
  status: string;
  closedAt: string | null;
  closeNote: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  if (closedAt) {
    return (
      <div>
        <p className="flex items-start gap-2 text-step--1 text-ink-soft">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <span>
            Closed. The client can read this but cannot message, raise a ticket or cancel
            against it.
          </span>
        </p>
        {closeNote ? (
          <p className="mt-2 rounded-lg bg-surface-2 p-3 text-step--2 text-ink-soft">{closeNote}</p>
        ) : null}
        <div className="mt-4">
          <ConfirmButton
            label="Reopen"
            confirmLabel="Reopen this work?"
            onConfirm={async () => {
              const result = await reopenRequestAction(requestId);
              toast({
                kind: result.ok ? "success" : "error",
                title: result.ok ? "Reopened" : "Could not reopen",
                description: result.message,
              });
              if (result.ok) router.refresh();
            }}
          />
        </div>
      </div>
    );
  }

  const ready = progress >= 100 && ["DELIVERED", "CONVERTED"].includes(status);

  if (!ready) {
    return (
      <p className="text-step--1 text-ink-soft">
        Deliver this and set progress to 100% before you can close it.
        {progress < 100 ? ` Currently ${progress}%.` : ""}
      </p>
    );
  }

  return open ? (
    <ActionForm
      action={async (state, formData) => {
        const result = await closeRequestAction(state, formData);
        if (result.ok) {
          setOpen(false);
          router.refresh();
        }
        return result;
      }}
      successTitle="Closed"
    >
      <input type="hidden" name="requestId" value={requestId} />
      <Field
        label="Closing note"
        htmlFor={`close-note-${requestId}`}
        hint="Optional. The client sees this as the last word on the work."
      >
        <Textarea id={`close-note-${requestId}`} name="note" rows={3} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingLabel="Closing…">
          <Lock className="h-4 w-4" />
          Close this work
        </SubmitButton>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Back
        </Button>
      </div>
    </ActionForm>
  ) : (
    <div>
      <p className="text-step--1 text-ink-soft">
        Delivered and at 100%. Closing settles it: the client can still read everything, but
        cannot message, raise a ticket or cancel against it afterwards.
      </p>
      <Button size="sm" className="mt-4" onClick={() => setOpen(true)}>
        <Lock className="h-4 w-4" />
        Close this work
      </Button>
    </div>
  );
}
