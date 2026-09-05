"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createCustomRequestAction } from "@/actions/requests";

/**
 * Raising bespoke work against a client.
 *
 * The request lands in that client's portal like any other, so a piece of
 * custom work has the same timeline, status and files as everything else,
 * rather than living in an email thread nobody else can see.
 */
export function CustomRequestForm({
  clients,
  services,
}: {
  clients: { id: string; label: string }[];
  services: { id: string; title: string }[];
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen((value) => !value)}>
        <Plus className="h-4 w-4" />
        {open ? "Close" : "New request for a client"}
      </Button>

      {open ? (
        <div className="mt-4 rounded-lg border border-accent-border bg-accent-soft/40 p-4">
          <ActionForm
            action={createCustomRequestAction}
            successTitle="Request created"
            resetOnSuccess
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client" htmlFor="cr-client">
                <Select id="cr-client" name="clientId" required>
                  <option value="">Choose a client…</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Service"
                htmlFor="cr-service"
                hint="Leave empty for work that is not one of the catalogue services."
              >
                <Select id="cr-service" name="serviceId">
                  <option value="">Custom work</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.title}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Title" htmlFor="cr-title">
              <Input
                id="cr-title"
                name="title"
                placeholder="Checkout rebuild — phase 1"
                required
              />
            </Field>
            <Field
              label="What is being delivered"
              htmlFor="cr-brief"
              hint="The client reads this, so write it as you would to them."
            >
              <Textarea id="cr-brief" name="brief" rows={4} required />
            </Field>
            <Field label="Budget" htmlFor="cr-budget" hint="Optional — e.g. $2,400 or a range.">
              <Input id="cr-budget" name="budget" placeholder="Optional" />
            </Field>

            <SubmitButton>Create and share with the client</SubmitButton>
          </ActionForm>
        </div>
      ) : null}
    </div>
  );
}
