import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { ContactForm } from "@/components/marketing/contact-form";
import { JsonLd, PageHeader } from "@/components/ui/section";
import { IconBadge } from "@/components/ui/icon";
import { getServices } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Contact",
    description:
      "Tell us what you are trying to grow. A 30-minute call, an honest read on fit, and a fixed-scope proposal if we are right for it.",
    path: "/contact",
  });
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; budget?: string }>;
}) {
  const [services, settings, query] = await Promise.all([getServices(), getSettings(), searchParams]);
  const { contact } = settings;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <PageHeader
        eyebrow="Contact"
        title="Tell us what you are trying to grow"
        description="We reply within one business day with either a proposal, a question, or an honest note that we are not the right fit."
      />

      <section className="section">
        <div className="container grid gap-12 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-border bg-card p-7 md:p-9">
            <ContactForm
              services={services.map((service) => ({ slug: service.slug, title: service.title }))}
              defaultService={query.service}
              defaultBudget={query.budget}
            />
          </div>

          <aside className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-base font-semibold">Direct contact</h2>
              <ul className="mt-4 space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="block text-xs text-muted-foreground">Email</span>
                    <a href={`mailto:${contact.email}`} className="hover:text-primary">
                      {contact.email}
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="block text-xs text-muted-foreground">Phone</span>
                    <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-primary">
                      {contact.phone}
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="block text-xs text-muted-foreground">WhatsApp</span>
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      Start a chat
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="block text-xs text-muted-foreground">Office</span>
                    {contact.addressLine}, {contact.city}, {contact.country}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="block text-xs text-muted-foreground">Hours</span>
                    {contact.hours}
                  </span>
                </li>
              </ul>
            </div>

            <div className="brand-ring rounded-xl border border-border bg-card p-6">
              <IconBadge name="Timer" />
              <h2 className="mt-4 font-display text-base font-semibold">What happens next</h2>
              <ol className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                <li>1. We read your enquiry properly — no automated qualification.</li>
                <li>2. You get a reply within one business day, {contact.responseTime.toLowerCase()}.</li>
                <li>3. A 30-minute call to understand scope and constraints.</li>
                <li>4. A fixed-scope proposal, usually within two working days after that.</li>
              </ol>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
