import type { Metadata } from "next";
import { Check } from "lucide-react";

import { JsonLd, PageHeader, SectionHeading } from "@/components/ui/section";
import { IconBadge } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { Metrics, Testimonials } from "@/components/marketing/sections";
import { Reveal } from "@/components/ui/reveal";
import { getHomepage, getTeam, getTestimonials } from "@/lib/content";
import { aboutPage } from "@/content/site";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "About",
    description: aboutPage.intro,
    path: "/about",
  });
}

export default async function AboutPage() {
  const [team, homepage, testimonials] = await Promise.all([
    getTeam(),
    getHomepage(),
    getTestimonials(),
  ]);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <PageHeader eyebrow="About" title={aboutPage.headline} description={aboutPage.intro}>
        <ButtonLink href="/contact">Work with us</ButtonLink>
        <ButtonLink href="/work" variant="outline">
          See our work
        </ButtonLink>
      </PageHeader>

      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="prose-hy max-w-prose">
            <h2>Why we exist</h2>
            {aboutPage.story.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
          <div className="rounded-xl border border-line bg-surface p-7">
            <h2 className="font-display text-lg font-bold">What we do in-house</h2>
            <ul className="mt-5 space-y-3">
              {aboutPage.capabilities.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-ink-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section border-y border-line bg-surface-2/40">
        <div className="container-x">
          <SectionHeading eyebrow="Values" title="Four rules we do not break" align="center" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {aboutPage.values.map((value, index) => (
              <Reveal
                key={value.title}
                delay={index * 60}
                className="rounded-xl border border-line bg-surface p-6"
              >
                <IconBadge name={value.icon} />
                <h3 className="mt-5 font-display text-base font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{value.detail}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionHeading
            eyebrow="Team"
            title="The people who will actually do the work"
            description="No account layer between you and the practitioners."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member, index) => (
              <Reveal
                key={member.name}
                delay={(index % 3) * 60}
                className="rounded-xl border border-line bg-surface p-6"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent font-display text-base font-bold text-accent-ink">
                  {member.name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </span>
                <h3 className="mt-4 font-display text-base font-semibold">{member.name}</h3>
                <p className="text-sm text-accent">{member.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{member.bio}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-y border-line bg-surface-2/40">
        <div className="container-x">
          <Metrics items={homepage.metrics} />
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionHeading eyebrow="Clients" title="In their words" align="center" />
          <div className="mt-12">
            <Testimonials items={testimonials} />
          </div>
        </div>
      </section>
    </>
  );
}
