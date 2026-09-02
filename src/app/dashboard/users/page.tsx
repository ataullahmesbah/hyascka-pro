import { DashboardHeader, Panel, StatCard } from "@/components/dashboard/page-shell";
import { UserRoleControls } from "@/components/dashboard/user-controls";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import Link from "next/link";

import { ListFilters } from "@/components/dashboard/filters";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { requirePermission, toActor } from "@/lib/auth/guards";
import { can, ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ROLE_ORDER = [
  "SUPER_ADMIN",
  "ADMIN",
  "FINANCE",
  "PROJECT_MANAGER",
  "EDITOR",
  "SUPPORT",
  "CLIENT",
] as const;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const [actor, query] = await Promise.all([requirePermission("users.read"), searchParams]);
  const activeRole = (ROLE_ORDER as readonly string[]).includes(query.role ?? "")
    ? (query.role as (typeof ROLE_ORDER)[number])
    : "ALL";
  const canManageRoles = can(toActor(actor), "roles.manage");
  const canManageStatus = can(toActor(actor), "users.manage");

  const search = query.q?.trim();
  const where = {
    ...(activeRole === "ALL" ? {} : { role: activeRole }),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, staffCount, clientCount, roleCounts] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        emailVerifiedAt: true,
      },
    }),
    prisma.user.count({ where: { role: { not: "CLIENT" } } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
  ]);

  const countFor = (role: string) =>
    role === "ALL"
      ? roleCounts.reduce((sum, row) => sum + row._count, 0)
      : (roleCounts.find((row) => row.role === role)?._count ?? 0);

  return (
    <>
      <DashboardHeader
        title="Users & roles"
        description="Access is granted by role. The dashboard navigation is generated from the permission matrix, and the server re-checks it on every request."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Staff accounts" value={staffCount} icon="ShieldCheck" />
        <StatCard label="Client accounts" value={clientCount} icon="Users" tone="info" />
        <StatCard label="Total" value={users.length} icon="UserCog" />
      </div>

      {/* Role tabs — a hundred clients should never bury six staff accounts. */}
      <nav className="scrollbar-thin mb-4 flex gap-1.5 overflow-x-auto pb-1" aria-label="Filter by role">
        {(["ALL", ...ROLE_ORDER] as const).map((role) => {
          const active = activeRole === role;
          const label = role === "ALL" ? "All users" : ROLE_LABELS[role as keyof typeof ROLE_LABELS];
          return (
            <Link
              key={role}
              href={role === "ALL" ? "/dashboard/users" : `/dashboard/users?role=${role}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-3.5 py-1.5 text-step--1 font-medium transition-colors duration-fast",
                active
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-ink-soft hover:bg-surface-2 hover:text-ink",
              )}
            >
              {label}
              <span className={cn("text-step--2", active ? "text-accent" : "text-ink-muted")}>
                {countFor(role)}
              </span>
            </Link>
          );
        })}
      </nav>

      <ListFilters placeholder="Search name or email…" />

      <Panel
        title={activeRole === "ALL" ? "All accounts" : `${ROLE_LABELS[activeRole as keyof typeof ROLE_LABELS]} accounts`}
        description={`${users.length} shown`}
        className="mb-6"
      >
        <TableWrap className="border-0">
          <Table className="min-w-[52rem]">
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Last sign-in</Th>
                <Th>Joined</Th>
                {canManageRoles || canManageStatus ? <Th>Manage</Th> : null}
              </tr>
            </thead>
            <tbody>
              {!users.length ? (
                <Tr>
                  <Td colSpan={6} className="py-10 text-center text-ink-muted">
                    No accounts match this filter.
                  </Td>
                </Tr>
              ) : null}
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-ink-muted">
                      {user.email}
                      {user.emailVerifiedAt ? "" : " · unverified"}
                    </p>
                  </Td>
                  <Td className="text-ink-muted">{ROLE_LABELS[user.role]}</Td>
                  <Td>
                    <StatusBadge status={user.status} />
                  </Td>
                  <Td className="whitespace-nowrap text-ink-muted">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
                  </Td>
                  <Td className="whitespace-nowrap text-ink-muted">{formatDate(user.createdAt)}</Td>
                  {canManageRoles || canManageStatus ? (
                    <Td>
                      <UserRoleControls
                        userId={user.id}
                        role={user.role}
                        status={user.status}
                        isSelf={user.id === actor.id}
                        canManageRoles={canManageRoles}
                        canManageStatus={canManageStatus}
                      />
                    </Td>
                  ) : null}
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Panel>

      <Panel
        title="Permission matrix"
        description="The authoritative source of truth. Every dashboard menu and server check derives from this."
      >
        <TableWrap className="border-0">
          <Table className="min-w-[44rem]">
            <thead>
              <tr>
                <Th>Role</Th>
                <Th>Granted permissions</Th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
                <Tr key={role}>
                  <Td className="whitespace-nowrap font-medium">{ROLE_LABELS[role as keyof typeof ROLE_LABELS]}</Td>
                  <Td>
                    {permissions.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {permissions.map((permission) => (
                          <code
                            key={permission}
                            className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-muted"
                          >
                            {permission}
                          </code>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-ink-muted">
                        Own records only — scoped by ownership checks on every query.
                      </span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Panel>
    </>
  );
}
