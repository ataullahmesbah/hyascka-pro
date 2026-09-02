import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { TrackingScripts } from "@/components/marketing/tracking";
import { DeferredWidgets } from "@/components/marketing/deferred";
import { SiteRuntime } from "@/components/marketing/site-runtime";
import { AnnouncementBar } from "@/components/marketing/announcement";
import { MaintenanceNoticeBar } from "@/components/marketing/widgets";
import { JsonLd } from "@/components/ui/section";
import { getHomepage, getNavigation, getServices } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { organizationSchema } from "@/lib/seo";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [settings, navigation, services, homepage, orgSchema] = await Promise.all([
    getSettings(),
    getNavigation(),
    getServices(),
    getHomepage(),
    organizationSchema(),
  ]);

  // This layout deliberately does not read cookies, so every marketing page
  // stays statically generated. A signed-in visitor who clicks "Client Login"
  // is redirected straight to their dashboard by middleware.
  const headerLinks = navigation
    .filter((item) => item.location === "HEADER")
    .sort((a, b) => a.position - b.position)
    .map((item) => ({ label: item.label, href: item.href }));

  const navServices = services.slice(0, 8).map((service) => ({
    slug: service.slug,
    title: service.title,
    tagline: service.tagline,
    icon: service.icon,
  }));

  const whatsappOn = Boolean(settings.featureFlags.whatsapp_widget && settings.contact.whatsapp);
  const assistantOn = Boolean(settings.featureFlags.ai_assistant);

  return (
    <>
      <JsonLd data={orgSchema} />
      <TrackingScripts ids={settings.tracking} />

      {settings.maintenance.isBannerActive && settings.maintenance.bannerText ? (
        <MaintenanceNoticeBar
          text={settings.maintenance.bannerText}
          endAt={settings.maintenance.endAt}
        />
      ) : null}

      {homepage.announcement.enabled && homepage.announcement.text ? (
        <AnnouncementBar
          text={homepage.announcement.text}
          href={homepage.announcement.href}
          linkLabel={homepage.announcement.linkLabel}
        />
      ) : null}

      <Navbar links={headerLinks} services={navServices} siteName={settings.brand.siteName} />

      <main id="main">{children}</main>

      <Footer
        settings={settings}
        navigation={navigation}
        newsletterEnabled={Boolean(settings.featureFlags.newsletter)}
      />

      <DeferredWidgets
        whatsapp={
          whatsappOn
            ? {
                phone: settings.contact.whatsapp,
                greeting: settings.whatsapp.greeting,
                label: settings.whatsapp.label,
              }
            : null
        }
        assistant={assistantOn ? settings.assistant : null}
        exitIntent={Boolean(settings.featureFlags.exit_intent_cta)}
      />

      <SiteRuntime />

    </>
  );
}
