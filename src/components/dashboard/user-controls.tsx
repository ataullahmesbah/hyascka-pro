"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

import { changeUserRoleAction, changeUserStatusAction } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABELS } from "@/lib/rbac";

const ROLES = Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[];

const STATUSES = [
  { value: "ACTIVE", label: "Active", hint: "Can sign in and use the site." },
  { value: "SUSPENDED", label: "Suspended", hint: "Signed out; can be restored at any time." },
  { value: "DISABLED", label: "Disabled", hint: "Signed out; the account is closed." },
] as const;

/**
 * Access control for one account.
 *
 * Nothing here saves on change. A role or status is a security decision, so it
 * takes a deliberate submit — and anything that signs somebody out asks once
 * more before it does. Every outcome, success or refusal, is reported.
 */
export function UserRoleControls({
  userId,
  email,
  role,
  status,
  isSelf,
  canManageRoles,
  canManageStatus,
}: {
  userId: string;
  email: string;
  role: string;
  status: string;
  isSelf: boolean;
  canManageRoles: boolean;
  canManageStatus: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [nextRole, setNextRole] = React.useState(role);
  const [nextStatus, setNextStatus] = React.useState(status);
  const [reason, setReason] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);

  const [roleState, roleAction, rolePending] = useActionState(changeUserRoleAction, null);
  const [statusState, statusAction, statusPending] = useActionState(changeUserStatusAction, null);

  // Each result is announced once. Tracking the two separately matters: a
  // status result must not be masked by an older role result still in state.
  const seenRole = React.useRef<unknown>(null);
  const seenStatus = React.useRef<unknown>(null);

  React.useEffect(() => {
    for (const [state, seen] of [
      [roleState, seenRole],
      [statusState, seenStatus],
    ] as const) {
      if (!state || state === seen.current) continue;
      seen.current = state;
      if (!state.message) continue;
      toast({
        kind: state.ok ? "success" : "error",
        title: state.ok ? "Access updated" : "Could not update",
        description: state.message,
      });
      if (state.ok) {
        setConfirming(false);
        setReason("");
        router.refresh();
      }
    }
  }, [roleState, statusState, toast, router]);

  if (isSelf) {
    return <span className="text-step--2 text-ink-muted">Your own account</span>;
  }

  const roleChanged = nextRole !== role;
  const statusChanged = nextStatus !== status;
  // Anything that ends the person's sessions is worth a second look.
  const signsThemOut = roleChanged || (statusChanged && nextStatus !== "ACTIVE");
  const pending = rolePending || statusPending;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        {canManageRoles ? (
          <div>
            <label htmlFor={`role-${userId}`} className="text-[0.65rem] font-medium text-ink-muted">
              Role
            </label>
            <Select
              id={`role-${userId}`}
              value={nextRole}
              onChange={(event) => setNextRole(event.target.value)}
              className="mt-0.5 h-9 w-40 text-step--2"
            >
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {canManageStatus ? (
          <div>
            <label htmlFor={`status-${userId}`} className="text-[0.65rem] font-medium text-ink-muted">
              Status
            </label>
            <Select
              id={`status-${userId}`}
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value)}
              className="mt-0.5 h-9 w-36 text-step--2"
            >
              {STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              {/* A pending account keeps its own state until it verifies. */}
              {status === "PENDING_VERIFICATION" ? (
                <option value="PENDING_VERIFICATION">Pending verification</option>
              ) : null}
            </Select>
          </div>
        ) : null}

        {roleChanged || statusChanged ? (
          <Button
            size="sm"
            variant={confirming ? "danger" : "primary"}
            disabled={pending}
            onClick={() => {
              if (signsThemOut && !confirming) {
                setConfirming(true);
                return;
              }
              // Role and status are separate decisions with separate
              // permissions, so each is submitted on its own.
              if (roleChanged) {
                const data = new FormData();
                data.set("userId", userId);
                data.set("role", nextRole);
                React.startTransition(() => roleAction(data));
              }
              if (statusChanged) {
                const data = new FormData();
                data.set("userId", userId);
                data.set("status", nextStatus);
                if (reason) data.set("reason", reason);
                React.startTransition(() => statusAction(data));
              }
            }}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirming ? "Yes — apply and sign them out" : "Save changes"}
          </Button>
        ) : null}

        {roleChanged || statusChanged ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
              setNextRole(role);
              setNextStatus(status);
              setReason("");
              setConfirming(false);
            }}
          >
            Cancel
          </Button>
        ) : null}
      </div>

      {confirming ? (
        <div className="rounded-lg border border-warning/40 bg-warning-soft p-3">
          <p className="flex items-start gap-2 text-step--2 text-warning">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {email} will be signed out of every device immediately
              {roleChanged ? ` and their role becomes ${ROLE_LABELS[nextRole as keyof typeof ROLE_LABELS]}` : ""}
              {statusChanged ? ` and their account becomes ${nextStatus.toLowerCase()}` : ""}.
            </span>
          </p>
          {statusChanged && nextStatus !== "ACTIVE" ? (
            <div className="mt-3">
              <Field label="Reason" htmlFor={`reason-${userId}`} hint="Recorded in the audit log.">
                <Input
                  id={`reason-${userId}`}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Why is this account being suspended?"
                />
              </Field>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
