import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/page-shell";
import { ServiceEditor } from "@/components/dashboard/service-editor";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

/** Turns a stored Title/Detail list back into the one-per-line form the editor shows. */
function toTitledLines(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return "";
      const { title, detail } = entry as { title?: unknown; detail?: unknown };
      if (typeof title !== "string" || !title) return "";
      return typeof detail === "string" && detail ? `${title} | ${detail}` : title;
    })
    .filter(Boolean)
    .join("\n");
}

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("services.manage");
  const { id } = await params;

  const [service, categories] = await Promise.all([
    prisma.service.findUnique({
      where: { id },
      include: {
        category: { select: { slug: true } },
        features: { orderBy: { position: "asc" }, select: { title: true, detail: true } },
        faqs: { orderBy: { position: "asc" }, select: { question: true, answer: true } },
        packages: { orderBy: { position: "asc" } },
      },
    }),
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
          features: toTitledLines(service.features),
          processSteps: toTitledLines(service.processSteps),
          faqs: service.faqs.map((faq) => `${faq.question} | ${faq.answer}`).join("\n"),
          packages: service.packages
            .map((pkg) =>
              [
                `${pkg.highlighted ? "*" : ""}${pkg.name}`,
                pkg.price === null ? "" : String(Number(pkg.price)),
                pkg.billingCycle ?? "",
                pkg.summary ?? "",
                pkg.features.join("; "),
              ].join(" | "),
            )
            .join("\n"),
        }}
      />
    </>
  );
}
