import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/page-shell";
import { ServiceEditor } from "@/components/dashboard/service-editor";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("services.manage");
  const { id } = await params;

  const [service, categories] = await Promise.all([
    prisma.service.findUnique({ where: { id }, include: { category: { select: { slug: true } } } }),
    prisma.serviceCategory.findMany({ orderBy: { position: "asc" }, select: { slug: true, name: true } }),
  ]);
  if (!service) notFound();

  return (
    <>
      <DashboardHeader
        title={service.title}
        description="Edit the public service page. Saving republishes it immediately."
        breadcrumbs={[{ label: "Services", href: "/dashboard/services" }, { label: service.title }]}
        actions={
          <ButtonLink href={`/services/${service.slug}`} variant="outline" size="sm" target="_blank">
            Preview page
          </ButtonLink>
        }
      />
      <ServiceEditor
        categories={categories}
        draft={{
          id: service.id,
          title: service.title,
          slug: service.slug,
          tagline: service.tagline ?? "",
          shortDescription: service.shortDescription,
          longDescription: service.longDescription,
          categorySlug: service.category?.slug ?? categories[0]?.slug ?? "",
          icon: service.icon ?? "",
          timeline: service.timeline ?? "",
          pricingModel: service.pricingModel,
          startingPrice: service.startingPrice ? String(service.startingPrice) : "",
          currency: service.currency,
          status: service.status,
          featured: service.featured,
          metaTitle: service.metaTitle ?? "",
          metaDescription: service.metaDescription ?? "",
          deliverables: service.deliverables.join("\n"),
          technologies: service.technologies.join("\n"),
        }}
      />
    </>
  );
}
