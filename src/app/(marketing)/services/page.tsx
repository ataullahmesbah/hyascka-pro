import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/section";
import { ServicesGrid } from "@/components/marketing/sections";
import { ButtonLink } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon";
import { ServiceFilter } from "@/components/marketing/service-filter";
import { getServiceCategories, getServices } from "@/lib/content";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/ui/section";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Services",
    description:
      "Web development, e-commerce, SEO, paid media, brand design and AI automation — delivered as one accountable programme with measurable outcomes.",
    path: "/services",
  });
}

export default async function ServicesPage() {
  const [services, categories] = await Promise.all([getServices(), getServiceCategories()]);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ])}
      />
      <PageHeader
        eyebrow="Services"
        title="Everything needed to build, launch and grow a digital business"
        description="Each service below states what you get, how long it takes and what it starts at. No opaque packages, no hourly estimates that drift."
      >
        <ButtonLink href="/contact">Start a project</ButtonLink>
        <ButtonLink href="/pricing" variant="outline">
          Compare packages
        </ButtonLink>
      </PageHeader>

      <section className="section">
        <div className="container-x">
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            {categories.map((category) => (
              <div key={category.slug} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-5">
                <IconBadge name={category.icon} size="sm" />
                <div>
                  <h2 className="font-display text-sm font-semibold">{category.name}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    {category.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="sr-only">All services</h2>
          <ServiceFilter
            categories={categories.map((category) => ({ slug: category.slug, name: category.name }))}
            services={services.map((service) => ({
              slug: service.slug,
              categorySlug: service.categorySlug,
            }))}
          >
            <ServicesGrid services={services} />
          </ServiceFilter>
        </div>
      </section>
    </>
  );
}
