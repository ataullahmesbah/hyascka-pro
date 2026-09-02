import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { CookieConsent } from "@/components/marketing/cookie-consent";
import { TrackingScripts } from "@/components/marketing/tracking";
import {
  AnnouncementBar,
  BackToTop,
  ContactWidget,
  ExitIntentCta,
  MaintenanceNoticeBar,
} from "@/components/marketing/widgets";
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

  // Note: this layout deliberately does not read cookies, so every marketing
  // page stays statically generated (PRD §40.1). A signed-in visitor who clicks
  // "Client Login" is redirected straight to their dashboard by middleware.

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

      <Navbar
        links={headerLinks}
        services={navServices}
        siteName={settings.brand.siteName}
      />

      <main id="main">{children}</main>

      <Footer
        settings={settings}
        navigation={navigation}
        newsletterEnabled={Boolean(settings.featureFlags.newsletter)}
      />

      <CookieConsent />
      <BackToTop />
      {settings.featureFlags.whatsapp_widget ? (
        <ContactWidget
          whatsapp={settings.contact.whatsapp}
          message="Hi HYASCKA — I'd like to discuss a project."
        />
      ) : null}
      {settings.featureFlags.exit_intent_cta ? <ExitIntentCta /> : null}
    </>
  );
}
