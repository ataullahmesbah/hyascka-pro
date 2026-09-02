import type { Metadata } from "next";
import { LifeBuoy, MessageSquare, ShieldQuestion } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { JsonLd, PageHeader } from "@/components/ui/section";
import { Accordion } from "@/components/ui/accordion";
import { getFaqs } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Support",
    description:
      "Existing client? Open a ticket from your dashboard. Everyone else can reach the team here.",
    path: "/support",
  });
}

export default async function SupportPage() {
  const [faqs, settings] = await Promise.all([getFaqs(), getSettings()]);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Support", path: "/support" },
        ])}
      />
      <PageHeader
        eyebrow="Support"
        title="Get help, quickly"
        description="Clients get a tracked ticket with a response-time commitment. Anyone else can email us directly."
      />

      <section className="section">
        <div className="container grid gap-5 md:grid-cols-3">
          <div className="brand-ring rounded-xl border border-border bg-card p-7">
            <LifeBuoy className="h-8 w-8 text-primary" />
            <h2 className="mt-4 font-display text-lg font-semibold">Existing client</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Open a ticket from your dashboard. Everything stays attached to your account, with
              full history and status.
            </p>
            <ButtonLink href="/dashboard/support" className="mt-5 w-full">
              Open a ticket
            </ButtonLink>
          </div>

          <div className="rounded-xl border border-border bg-card p-7">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h2 className="mt-4 font-display text-lg font-semibold">General enquiry</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Not a client yet, or asking about a new project? Use the contact form and we will reply
              within one business day.
            </p>
            <ButtonLink href="/contact" variant="outline" className="mt-5 w-full">
              Contact us
            </ButtonLink>
          </div>

          <div className="rounded-xl border border-border bg-card p-7">
            <ShieldQuestion className="h-8 w-8 text-primary" />
            <h2 className="mt-4 font-display text-lg font-semibold">Security or billing</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Report a security concern or a billing question directly to the team that handles it.
            </p>
            <div className="mt-5 space-y-1.5 text-sm">
              <a href={`mailto:${settings.contact.supportEmail}`} className="block text-primary hover:underline">
                {settings.contact.supportEmail}
              </a>
              <a href={`mailto:security@hyascka.com`} className="block text-primary hover:underline">
                security@hyascka.com
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section border-t border-border">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl font-bold">Before you write in</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            These come up most often and may save you the wait.
          </p>
          <Accordion
            className="mt-6"
            items={faqs.slice(0, 6).map((faq, index) => ({
              id: `support-faq-${index}`,
              question: faq.question,
              answer: faq.answer,
            }))}
          />
        </div>
      </section>
    </>
  );
}
