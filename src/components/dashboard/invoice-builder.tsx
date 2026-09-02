"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { createInvoiceAction } from "@/actions/finance";
import { ActionForm, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { Panel } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatCurrency } from "@/lib/utils";

type Line = { description: string; quantity: number; unitPrice: number; discount: number; taxRate: number };

const EMPTY: Line = { description: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 };

export function InvoiceBuilder({
  clients,
}: {
  clients: { id: string; label: string; email: string }[];
}) {
  const [lines, setLines] = React.useState<Line[]>([{ ...EMPTY }]);
  const [currency, setCurrency] = React.useState("BDT");
  const router = useRouter();

  const update = (index: number, patch: Partial<Line>) =>
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  // Preview only — the server recomputes every figure before saving.
  const totals = React.useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    for (const line of lines) {
      const gross = line.quantity * line.unitPrice;
      const net = Math.max(0, gross - line.discount);
      subtotal += gross;
      discount += line.discount;
      tax += (net * line.taxRate) / 100;
    }
    return { subtotal, discount, tax, total: subtotal - discount + tax };
  }, [lines]);

  const dueDefault = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);

  return (
    <ActionForm
      action={async (state, formData) => {
        formData.set("items", JSON.stringify(lines));
        const result = await createInvoiceAction(state, formData);
        if (result.ok && result.data?.id) {
          router.push(`/dashboard/finance/invoices/${result.data.id}`);
        }
        return result;
      }}
      successTitle="Invoice issued"
    >
      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="space-y-5">
          <Panel title="Client and terms">
            <div className="grid gap-5 sm:grid-cols-2">
              <ClientField clients={clients} />
              <DueDateField defaultValue={dueDefault} />
              <CurrencyField value={currency} onChange={setCurrency} />
            </div>
            <div className="mt-5">
              <NotesField />
            </div>
          </Panel>

          <Panel
            title="Line items"
            action={
              <Button variant="outline" size="sm" onClick={() => setLines((c) => [...c, { ...EMPTY }])}>
                <Plus className="h-4 w-4" />
                Add line
              </Button>
            }
          >
            <div className="space-y-4">
              {lines.map((line, index) => (
                <div key={index} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <label htmlFor={`desc-${index}`} className="text-xs font-medium text-muted-foreground">
                      Description
                    </label>
                    <Input
                      id={`desc-${index}`}
                      value={line.description}
                      onChange={(event) => update(index, { description: event.target.value })}
                      placeholder="Web development — milestone 1"
                      className="mt-1"
                    />
                  </div>
                  <NumberCell
                    id={`qty-${index}`}
                    label="Qty"
                    span="sm:col-span-1"
                    value={line.quantity}
                    min={1}
                    onChange={(value) => update(index, { quantity: value })}
                  />
                  <NumberCell
                    id={`price-${index}`}
                    label="Unit price"
                    span="sm:col-span-2"
                    value={line.unitPrice}
                    onChange={(value) => update(index, { unitPrice: value })}
                  />
                  <NumberCell
                    id={`disc-${index}`}
                    label="Discount"
                    span="sm:col-span-2"
                    value={line.discount}
                    onChange={(value) => update(index, { discount: value })}
                  />
                  <NumberCell
                    id={`tax-${index}`}
                    label="Tax %"
                    span="sm:col-span-1"
                    value={line.taxRate}
                    max={100}
                    onChange={(value) => update(index, { taxRate: value })}
                  />
                  <div className="flex items-end sm:col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove line ${index + 1}`}
                      disabled={lines.length === 1}
                      onClick={() => setLines((c) => c.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Preview total">
            <dl className="space-y-2 text-sm">
              <Row label="Subtotal" value={formatCurrency(totals.subtotal, currency)} />
              <Row label="Discount" value={`-${formatCurrency(totals.discount, currency)}`} />
              <Row label="Tax" value={formatCurrency(totals.tax, currency)} />
              <div className="flex justify-between border-t border-border pt-2 font-display text-base font-bold">
                <dt>Total</dt>
                <dd>{formatCurrency(totals.total, currency)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              This preview is a convenience. The invoice total is recalculated server-side when you
              issue it.
            </p>
            <SubmitButton className="mt-5 w-full" pendingLabel="Issuing…">
              Issue invoice
            </SubmitButton>
          </Panel>
        </aside>
      </div>
    </ActionForm>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function NumberCell({
  id,
  label,
  value,
  onChange,
  span,
  min = 0,
  max,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  span: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className={span}>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="mt-1"
      />
    </div>
  );
}

function ClientField({ clients }: { clients: { id: string; label: string; email: string }[] }) {
  return (
    <Field label="Client" htmlFor="clientId" required error={useFieldError("clientId")}>
      <Select id="clientId" name="clientId" required defaultValue="">
        <option value="" disabled>
          Choose a client…
        </option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.label} — {client.email}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function DueDateField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Due date" htmlFor="dueDate" required error={useFieldError("dueDate")}>
      <Input id="dueDate" name="dueDate" type="date" defaultValue={defaultValue} required />
    </Field>
  );
}

function CurrencyField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field label="Currency" htmlFor="currency" error={useFieldError("currency")}>
      <Select id="currency" name="currency" value={value} onChange={(event) => onChange(event.target.value)}>
        {["BDT", "USD", "EUR", "GBP"].map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function NotesField() {
  return (
    <Field label="Notes" htmlFor="notes" hint="Shown to the client on the invoice." error={useFieldError("notes")}>
      <Textarea id="notes" name="notes" rows={3} placeholder="Milestone 1 of the agreed statement of work." />
    </Field>
  );
}
