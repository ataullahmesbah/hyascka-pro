import { DashboardHeader } from "@/components/dashboard/page-shell";
import { ServiceEditor } from "@/components/dashboard/service-editor";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  await requirePermission("services.manage");
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { position: "asc" },
    select: { slug: true, name: true },
  });

  return (
    <>
      <DashboardHeader
        title="New service"
        description="Add a service to the public catalogue."
        breadcrumbs={[{ label: "Services", href: "/dashboard/services" }, { label: "New" }]}
      />
      <ServiceEditor
        categories={categories}
        draft={{
          title: "",
          slug: "",
          tagline: "",
          shortDescription: "",
          longDescription: "",
          categorySlug: categories[0]?.slug ?? "",
          icon: "Sparkles",
          timeline: "",
          pricingModel: "STARTING_FROM",
          startingPrice: "",
          currency: "BDT",
          status: "DRAFT",
          featured: false,
          metaTitle: "",
          metaDescription: "",
          deliverables: "",
          technologies: "",
        }}
      />
    </>
  );
}
