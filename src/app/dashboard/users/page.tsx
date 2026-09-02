import { DashboardHeader, Panel, StatCard } from "@/components/dashboard/page-shell";
import { UserRoleControls } from "@/components/dashboard/user-controls";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission, toActor } from "@/lib/auth/guards";
import { can, ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const actor = await requirePermission("users.read");
  const canManageRoles = can(toActor(actor), "roles.manage");
  const canManageStatus = can(toActor(actor), "users.manage");

  const [users, staffCount, clientCount] = await Promise.all([
    prisma.user.findMany({
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
  ]);

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

      <Panel title="Accounts" className="mb-6">
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
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                      {user.emailVerifiedAt ? "" : " · unverified"}
                    </p>
                  </Td>
                  <Td className="text-muted-foreground">{ROLE_LABELS[user.role]}</Td>
                  <Td>
                    <StatusBadge status={user.status} />
                  </Td>
                  <Td className="whitespace-nowrap text-muted-foreground">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
                  </Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{formatDate(user.createdAt)}</Td>
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
                            className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {permission}
                          </code>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
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
