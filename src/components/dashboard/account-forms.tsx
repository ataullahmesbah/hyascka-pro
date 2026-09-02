"use client";

import * as React from "react";
import { Laptop, Smartphone } from "lucide-react";

import { changePasswordAction, revokeSessionAction } from "@/actions/auth";
import { updateProfileAction } from "@/actions/users";
import { ActionForm, ConfirmButton, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { PasswordInput } from "@/components/auth/auth-form";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { relativeTime } from "@/lib/utils";

export function ProfileForm({
  values,
  isClient,
}: {
  values: Record<string, string>;
  isClient: boolean;
}) {
  return (
    <ActionForm action={updateProfileAction} successTitle="Profile saved">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label="Full name" defaultValue={values.name} required />
        <TextField name="phone" label="Phone" defaultValue={values.phone} />
      </div>

      {isClient ? (
        <>
          <p className="pt-2 text-sm font-semibold">Billing details</p>
          <p className="-mt-3 text-xs text-muted-foreground">
            These appear on every invoice we issue to you.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="companyName" label="Company name" defaultValue={values.companyName} />
            <TextField name="billingEmail" label="Billing email" type="email" defaultValue={values.billingEmail} />
            <TextField name="billingPhone" label="Billing phone" defaultValue={values.billingPhone} />
            <TextField name="taxId" label="Tax / VAT ID" defaultValue={values.taxId} />
            <TextField name="addressLine1" label="Address" defaultValue={values.addressLine1} />
            <TextField name="city" label="City" defaultValue={values.city} />
            <TextField name="country" label="Country" defaultValue={values.country} />
          </div>
        </>
      ) : null}

      <SubmitButton>Save profile</SubmitButton>
    </ActionForm>
  );
}

export function ChangePasswordForm() {
  return (
    <ActionForm action={changePasswordAction} successTitle="Password updated">
      <Field label="Current password" htmlFor="currentPassword" required error={useFieldError("currentPassword")}>
        <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" />
      </Field>
      <Field
        label="New password"
        htmlFor="password"
        required
        hint="At least 10 characters, with an uppercase letter, a lowercase letter and a number."
        error={useFieldError("password")}
      >
        <PasswordInput id="password" name="password" autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" required error={useFieldError("confirmPassword")}>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" />
      </Field>
      <SubmitButton>Update password</SubmitButton>
    </ActionForm>
  );
}

export function SessionList({
  sessions,
  currentSessionId,
}: {
  sessions: { id: string; userAgent: string | null; ipAddress: string | null; lastActiveAt: string; createdAt: string }[];
  currentSessionId: string;
}) {
  const { toast } = useToast();

  if (!sessions.length) {
    return <p className="text-sm text-muted-foreground">No active sessions.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {sessions.map((session) => {
        const mobile = /mobile|android|iphone/i.test(session.userAgent ?? "");
        const Icon = mobile ? Smartphone : Laptop;
        const isCurrent = session.id === currentSessionId;

        return (
          <li key={session.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
            <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {describeAgent(session.userAgent)}
                {isCurrent ? <span className="ml-2 text-xs text-success">· this device</span> : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.ipAddress ?? "unknown IP"} · active {relativeTime(session.lastActiveAt)}
              </p>
            </div>
            {!isCurrent ? (
              <ConfirmButton
                label="Sign out"
                confirmLabel="Revoke it?"
                onConfirm={async () => {
                  await revokeSessionAction(session.id);
                  toast({ kind: "success", title: "Session revoked" });
                }}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function describeAgent(userAgent: string | null) {
  if (!userAgent) return "Unknown device";
  const browser =
    /edg/i.test(userAgent) ? "Edge"
    : /chrome/i.test(userAgent) ? "Chrome"
    : /safari/i.test(userAgent) ? "Safari"
    : /firefox/i.test(userAgent) ? "Firefox"
    : "Browser";
  const os =
    /windows/i.test(userAgent) ? "Windows"
    : /mac os/i.test(userAgent) ? "macOS"
    : /android/i.test(userAgent) ? "Android"
    : /iphone|ipad/i.test(userAgent) ? "iOS"
    : /linux/i.test(userAgent) ? "Linux"
    : "Unknown OS";
  return `${browser} on ${os}`;
}

function TextField({
  name,
  label,
  defaultValue,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <Field label={label} htmlFor={name} required={required} error={useFieldError(name)}>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
    </Field>
  );
}
