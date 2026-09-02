"use client";

import * as React from "react";
import { useActionState } from "react";

import { changeUserRoleAction, changeUserStatusAction } from "@/actions/users";
import { Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABELS } from "@/lib/rbac";

const ROLES = Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[];
const STATUSES = ["ACTIVE", "SUSPENDED", "DISABLED"] as const;

export function UserRoleControls({
  userId,
  role,
  status,
  isSelf,
  canManageRoles,
  canManageStatus,
}: {
  userId: string;
  role: string;
  status: string;
  isSelf: boolean;
  canManageRoles: boolean;
  canManageStatus: boolean;
}) {
  const [roleState, roleAction] = useActionState(changeUserRoleAction, null);
  const [statusState, statusAction] = useActionState(changeUserStatusAction, null);
  const { toast } = useToast();
  const seen = React.useRef<unknown>(null);

  React.useEffect(() => {
    const latest = roleState ?? statusState;
    if (!latest || latest === seen.current) return;
    seen.current = latest;
    if (latest.message) {
      toast({
        kind: latest.ok ? "success" : "error",
        title: latest.ok ? "Access updated" : "Could not update",
        description: latest.message,
      });
    }
  }, [roleState, statusState, toast]);

  if (isSelf) {
    return <span className="text-xs text-ink-muted">Your own account</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canManageRoles ? (
        <form action={roleAction}>
          <input type="hidden" name="userId" value={userId} />
          <label className="sr-only" htmlFor={`role-${userId}`}>
            Role
          </label>
          <Select
            id={`role-${userId}`}
            name="role"
            defaultValue={role}
            className="h-9 w-40 text-xs"
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
          >
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </Select>
        </form>
      ) : null}

      {canManageStatus ? (
        <form action={statusAction}>
          <input type="hidden" name="userId" value={userId} />
          <label className="sr-only" htmlFor={`status-${userId}`}>
            Status
          </label>
          <Select
            id={`status-${userId}`}
            name="status"
            defaultValue={status}
            className="h-9 w-32 text-xs"
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
              </option>
            ))}
          </Select>
        </form>
      ) : null}
    </div>
  );
}
