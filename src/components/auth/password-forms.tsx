"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { forgotPasswordAction, resetPasswordAction } from "@/actions/auth";
import { AuthSubmit, FormMessage, PasswordInput } from "@/components/auth/auth-form";
import { Field, Input } from "@/components/ui/field";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, null);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <Field label="Email" htmlFor="email" required error={state?.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
      </Field>
      <AuthSubmit label="Send reset link" pendingLabel="Sending…" />
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, null);
  const router = useRouter();

  React.useEffect(() => {
    if (state?.ok) {
      const timer = setTimeout(() => router.push("/login?reset=1"), 1500);
      return () => clearTimeout(timer);
    }
  }, [state?.ok, router]);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />

      <Field
        label="New password"
        htmlFor="password"
        required
        hint="At least 10 characters, with an uppercase letter, a lowercase letter and a number."
        error={state?.fieldErrors?.password}
      >
        <PasswordInput id="password" name="password" autoComplete="new-password" />
      </Field>

      <Field label="Confirm new password" htmlFor="confirmPassword" required error={state?.fieldErrors?.confirmPassword}>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" />
      </Field>

      <AuthSubmit label="Update password" pendingLabel="Updating…" />
    </form>
  );
}
