"use client";

import * as React from "react";

import { approveExpenseAction, createExpenseAction } from "@/actions/finance";
import { ActionForm, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

const CATEGORIES = ["Software", "Advertising", "Contractors", "Hardware", "Office", "Travel", "Other"];

export function ExpenseForm() {
  return (
    <ActionForm action={createExpenseAction} successTitle="Expense recorded" resetOnSuccess>
      <CategoryField />
      <VendorField />
      <AmountField />
      <CurrencyField />
      <DateField />
      <DescriptionField />
      <SubmitButton className="w-full">Record expense</SubmitButton>
    </ActionForm>
  );
}

function CategoryField() {
  return (
    <Field label="Category" htmlFor="category" required error={useFieldError("category")}>
      <Select id="category" name="category" defaultValue={CATEGORIES[0]}>
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function VendorField() {
  return (
    <Field label="Vendor" htmlFor="vendor" error={useFieldError("vendor")}>
      <Input id="vendor" name="vendor" placeholder="Vercel" />
    </Field>
  );
}

function AmountField() {
  return (
    <Field label="Amount" htmlFor="amount" required error={useFieldError("amount")}>
      <Input id="amount" name="amount" type="number" min={0} step="0.01" required />
    </Field>
  );
}

function CurrencyField() {
  return (
    <Field label="Currency" htmlFor="currency" error={useFieldError("currency")}>
      <Select id="currency" name="currency" defaultValue="BDT">
        {["BDT", "USD", "EUR", "GBP"].map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function DateField() {
  return (
    <Field label="Date" htmlFor="spentAt" required error={useFieldError("spentAt")}>
      <Input
        id="spentAt"
        name="spentAt"
        type="date"
        required
        defaultValue={new Date().toISOString().slice(0, 10)}
      />
    </Field>
  );
}

function DescriptionField() {
  return (
    <Field label="Description" htmlFor="description" error={useFieldError("description")}>
      <Textarea id="description" name="description" rows={2} placeholder="Hosting — monthly" />
    </Field>
  );
}

export function ExpenseDecision({ expenseId }: { expenseId: string }) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const decide = (approve: boolean) =>
    startTransition(async () => {
      try {
        await approveExpenseAction(expenseId, approve);
        toast({
          kind: "success",
          title: approve ? "Expense approved" : "Expense rejected",
          description: approve ? "A ledger entry has been created." : "No ledger entry was created.",
        });
      } catch (error) {
        toast({
          kind: "error",
          title: "Could not record decision",
          description: error instanceof Error ? error.message : "Unexpected error.",
        });
      }
    });

  return (
    <div className="flex gap-1.5">
      <Button size="sm" disabled={pending} onClick={() => decide(true)}>
        Approve
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => decide(false)}>
        Reject
      </Button>
    </div>
  );
}
