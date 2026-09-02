import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { NavigationEditor } from "@/components/dashboard/navigation-forms";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function NavigationPage() {
  await requirePermission("content.manage");
  const items = await prisma.navigationItem.findMany({
    orderBy: [{ location: "asc" }, { position: "asc" }],
  });

  return (
    <>
      <DashboardHeader
        title="Navigation"
        description="The links in the header and footer, and the order they appear in."
        breadcrumbs={[{ label: "Content" }, { label: "Navigation" }]}
      />

      <Panel title="Menus">
        <NavigationEditor
          items={items.map((item) => ({
            id: item.id,
            location: item.location,
            label: item.label,
            href: item.href,
            position: item.position,
            enabled: item.enabled,
          }))}
        />
      </Panel>
    </>
  );
}
