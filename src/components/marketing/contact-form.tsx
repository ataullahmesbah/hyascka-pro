"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import { submitContactForm } from "@/actions/public";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { trackEvent } from "@/components/marketing/tracking";

const BUDGETS = ["Under 100k", "100k – 200k", "200k – 400k", "400k – 800k", "800k+", "Not sure yet"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Sending…
        </>
      ) : (
        "Send enquiry"
      )}
    </Button>
  );
}

export function ContactForm({
  services,
  defaultService,
  defaultBudget,
}: {
  services: { slug: string; title: string }[];
  defaultService?: string;
  defaultBudget?: string;
}) {
  const [state, action] = useActionState(submitContactForm, null);
  const { toast } = useToast();
  const notified = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!state?.message || notified.current === state.message) return;
    notified.current = state.message;
    toast({
      kind: state.ok ? "success" : "error",
      title: state.ok ? "Enquiry sent" : "Could not send",
      description: state.message,
    });
    if (state.ok) trackEvent("contact_submit", { service: defaultService ?? "general" });
  }, [state, toast, defaultService]);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-success/35 bg-success/8 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <h2 className="mt-4 font-display text-xl font-bold">Enquiry received</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" required error={state?.fieldErrors?.name}>
          <Input id="name" name="name" autoComplete="name" required placeholder="Your name" />
        </Field>
        <Field label="Work email" htmlFor="email" required error={state?.fieldErrors?.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
        </Field>
        <Field label="Phone" htmlFor="phone" hint="Optional — helps if we need a quick call." error={state?.fieldErrors?.phone}>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+880 1571 083401" />
        </Field>
        <Field label="Company" htmlFor="company" error={state?.fieldErrors?.company}>
          <Input id="company" name="company" autoComplete="organization" placeholder="Company name" />
        </Field>
        <Field label="Service" htmlFor="serviceSlug" error={state?.fieldErrors?.serviceSlug}>
          <Select id="serviceSlug" name="serviceSlug" defaultValue={defaultService ?? ""}>
            <option value="">Not sure / general enquiry</option>
            {services.map((service) => (
              <option key={service.slug} value={service.slug}>
                {service.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Budget range" htmlFor="budget" hint="BDT. A range is fine." error={state?.fieldErrors?.budget}>
          <Select id="budget" name="budget" defaultValue={defaultBudget ?? ""}>
            <option value="">Prefer not to say</option>
            {BUDGETS.map((budget) => (
              <option key={budget} value={budget}>
                {budget}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="What are you trying to achieve?"
        htmlFor="message"
        required
        hint="The more specific the goal, the more useful our first reply will be."
        error={state?.fieldErrors?.message}
      >
        <Textarea
          id="message"
          name="message"
          required
          rows={6}
          placeholder="We are a B2B software company and our organic traffic has been flat for a year. We need…"
        />
      </Field>

      {/* Honeypot — hidden from users, filled by bots (PRD §17) */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="flex items-start gap-2.5">
        <Checkbox id="consent" name="consent" required className="mt-0.5" />
        <label htmlFor="consent" className="text-sm text-ink-muted">
          I agree that HYASCKA may store and use these details to respond to my enquiry, as described
          in the{" "}
          <a href="/privacy" className="text-accent underline-offset-4 hover:underline">
            privacy policy
          </a>
          .
        </label>
      </div>
      {state?.fieldErrors?.consent ? (
        <p className="text-xs font-medium text-danger">{state.fieldErrors.consent[0]}</p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton />
        {/* Trust badges near the form (PRD §39.6) */}
        <p className="flex items-center gap-2 text-xs text-ink-muted">
          <ShieldCheck className="h-4 w-4 text-success" />
          SSL secured · Your details are never sold or shared
        </p>
      </div>
    </form>
  );
}
