"use client";

import { useActionState } from "react";

import { registerAction } from "@/actions/auth";
import { AuthSubmit, FormMessage, PasswordInput } from "@/components/auth/auth-form";
import { Checkbox, Field, Input } from "@/components/ui/field";

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, null);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />

      <Field label="Full name" htmlFor="name" required error={state?.fieldErrors?.name}>
        <Input id="name" name="name" autoComplete="name" required placeholder="Your name" />
      </Field>

      <Field label="Work email" htmlFor="email" required error={state?.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company" htmlFor="company" error={state?.fieldErrors?.company}>
          <Input id="company" name="company" autoComplete="organization" placeholder="Optional" />
        </Field>
        <Field label="Phone" htmlFor="phone" error={state?.fieldErrors?.phone}>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="Optional" />
        </Field>
      </div>

      <Field
        label="Password"
        htmlFor="password"
        required
        hint="At least 10 characters, with an uppercase letter, a lowercase letter and a number."
        error={state?.fieldErrors?.password}
      >
        <PasswordInput id="password" name="password" autoComplete="new-password" />
      </Field>

      <Field label="Confirm password" htmlFor="confirmPassword" required error={state?.fieldErrors?.confirmPassword}>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" />
      </Field>

      <div className="flex items-start gap-2.5">
        <Checkbox id="acceptTerms" name="acceptTerms" required className="mt-0.5" />
        <label htmlFor="acceptTerms" className="text-sm text-ink-muted">
          I accept the{" "}
          <a href="/terms" className="text-accent underline-offset-4 hover:underline">
            terms of service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-accent underline-offset-4 hover:underline">
            privacy policy
          </a>
          .
        </label>
      </div>
      {state?.fieldErrors?.acceptTerms ? (
        <p className="text-xs font-medium text-danger">{state.fieldErrors.acceptTerms[0]}</p>
      ) : null}

      <AuthSubmit label="Create account" pendingLabel="Creating account…" />
    </form>
  );
}
