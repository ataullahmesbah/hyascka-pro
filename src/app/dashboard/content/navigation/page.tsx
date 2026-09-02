import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { EmptyState, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const LOCATION_LABELS: Record<string, string> = {
  HEADER: "Main navigation",
  FOOTER_SERVICES: "Footer — Services",
  FOOTER_COMPANY: "Footer — Company",
  FOOTER_LEGAL: "Footer — Legal",
};

export default async function NavigationPage() {
  await requirePermission("content.manage");
  const items = await prisma.navigationItem.findMany({ orderBy: [{ location: "asc" }, { position: "asc" }] });

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.location] ??= []).push(item);
    return acc;
  }, {});

  return (
    <>
      <DashboardHeader
        title="Navigation"
        description="Links in the header and footer, in the order they appear."
        breadcrumbs={[{ label: "Content" }, { label: "Navigation" }]}
      />

      {Object.keys(grouped).length ? (
        <div className="space-y-5">
          {Object.entries(grouped).map(([location, links]) => (
            <Panel key={location} title={LOCATION_LABELS[location] ?? location}>
              <TableWrap className="border-0">
                <Table className="min-w-[32rem]">
                  <thead>
                    <tr>
                      <Th>Position</Th>
                      <Th>Label</Th>
                      <Th>Link</Th>
                      <Th>Visible</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link) => (
                      <Tr key={link.id}>
                        <Td className="text-ink-muted">{link.position}</Td>
                        <Td className="font-medium">{link.label}</Td>
                        <Td className="font-mono text-xs text-ink-muted">{link.href}</Td>
                        <Td>
                          <StatusBadge status={link.enabled ? "PUBLISHED" : "DRAFT"} />
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="Menu"
          title="Navigation is using bundled defaults"
          description="Run the seed to make these links editable from the database."
        />
      )}
    </>
  );
}
