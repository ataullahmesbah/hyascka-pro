import type { Metadata } from "next";

import { JsonLd, PageHeader } from "@/components/ui/section";
import { FaqSearch } from "@/components/marketing/faq-search";
import { ButtonLink } from "@/components/ui/button";
import { getFaqs } from "@/lib/content";
import { breadcrumbSchema, faqSchema, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "FAQ",
    description:
      "Answers on how HYASCKA engagements work — pricing, ownership, timelines, payments, security and performance targets.",
    path: "/faq",
  });
}

export default async function FaqPage() {
  const faqs = await getFaqs();
  return (
    <>
      <JsonLd data={faqSchema(faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ])}
      />
      <PageHeader
        eyebrow="FAQ"
        title="Answers, including the inconvenient ones"
        description="If your question is not here, ask it directly. We would rather tell you we are the wrong fit early than late."
      >
        <ButtonLink href="/contact">Ask a question</ButtonLink>
      </PageHeader>

      <section className="section">
        <div className="container max-w-3xl">
          <FaqSearch items={faqs} />
        </div>
      </section>
    </>
  );
}
