import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { HomepageSectionEditor } from "@/components/dashboard/content-forms";
import { HeroEditor } from "@/components/dashboard/hero-editor";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { homepage as defaults } from "@/content/site";
import { getHomepage } from "@/lib/content";

export const dynamic = "force-dynamic";

const SECTION_HELP: Record<string, string> = {
  announcement: "The strip above the navigation. Turn it off when there is no campaign running.",
  hero: "Headline, supporting copy, both call-to-action buttons and the trust line.",
  capabilities: "The pill rail directly under the hero.",
  whyUs: "The four commitment cards. `span` is \"lg\" for a wide card or \"sm\" for a narrow one.",
  process: "The six-stage delivery timeline.",
  metrics: "Animated counters. Only put real, verifiable numbers here.",
  trustedBy: "The client logo strip — a plain list of names.",
  finalCta: "The closing call-to-action block.",
};

export default async function HomepageContentPage() {
  await requirePermission("content.manage");

  const [page, homepage] = await Promise.all([
    prisma.page
      .findUnique({ where: { slug: "home" }, include: { sections: { orderBy: { position: "asc" } } } })
      .catch(() => null),
    getHomepage(),
  ]);

  const sections = page?.sections.length
    ? page.sections.map((section) => ({
        key: section.key,
        title: section.title ?? section.key,
        enabled: section.enabled,
        data: JSON.stringify(section.data, null, 2),
      }))
    : Object.entries(defaults).map(([key, value]) => ({
        key,
        title: key,
        enabled: true,
        data: JSON.stringify(value, null, 2),
      }));

  return (
    <>
      <DashboardHeader
        title="Homepage"
        description="Each section is edited as structured content and republished the moment you save."
        breadcrumbs={[{ label: "Content" }, { label: "Homepage" }]}
        actions={
          <ButtonLink href="/" variant="outline" size="sm" target="_blank">
            Preview homepage
          </ButtonLink>
        }
      />

      {!page ? (
        <div className="mb-5 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
          The homepage record is not in the database yet, so these are the bundled defaults. Run{" "}
          <code className="rounded bg-warning/20 px-1">npm run db:seed</code> to make them editable.
        </div>
      ) : null}

      {/* The hero gets a proper structured editor; the rest are simple blocks. */}
      <Panel
        title="Hero slider"
        description="Two or three slides rotate at the top of the homepage. Everything here is editable without touching code."
        className="mb-5"
      >
        <HeroEditor content={homepage.hero} />
      </Panel>

      <div className="space-y-5">
        {sections
          .filter((section) => section.key !== "hero")
          .map((section) => (
            <Panel key={section.key} title={section.title} description={SECTION_HELP[section.key]}>
              <HomepageSectionEditor
                sectionKey={section.key}
                enabled={section.enabled}
                data={section.data}
                disabled={!page}
              />
            </Panel>
          ))}
      </div>
    </>
  );
}
