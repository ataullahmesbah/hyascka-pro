"use client";

import { useActionState } from "react";
import Link from "next/link";

import { loginAction } from "@/actions/auth";
import { AuthSubmit, FormMessage, PasswordInput } from "@/components/auth/auth-form";
import { Field, Input } from "@/components/ui/field";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, action] = useActionState(loginAction, null);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />

      <Field label="Email" htmlFor="email" required error={state?.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
      </Field>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            Password<span className="ml-0.5 text-danger">*</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="mt-1.5">
          <PasswordInput id="password" name="password" autoComplete="current-password" />
        </div>
        {state?.fieldErrors?.password ? (
          <p className="mt-1.5 text-xs font-medium text-danger">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <AuthSubmit label="Sign in" pendingLabel="Signing in…" />
    </form>
  );
}
