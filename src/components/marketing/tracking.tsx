"use client";

import Script from "next/script";

import { useConsent } from "@/components/marketing/cookie-consent";

/**
 * Consent-aware tracking (PRD §44.2). Every tag here is browser-side and
 * ID-only; the Meta CAPI access token lives server-side and is never rendered.
 */
export type TrackingIds = {
  ga4Id?: string;
  gtmId?: string;
  clarityId?: string;
  metaPixelId?: string;
};

export function TrackingScripts({ ids }: { ids: TrackingIds }) {
  const { consent } = useConsent();
  if (consent !== "granted") return null;

  return (
    <>
      {ids.gtmId ? (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${ids.gtmId}');`}
        </Script>
      ) : null}

      {ids.ga4Id ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ids.ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${ids.ga4Id}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}

      {ids.clarityId ? (
        <Script id="clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${ids.clarityId}");`}
        </Script>
      ) : null}

      {ids.metaPixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');fbq('init','${ids.metaPixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}

/** Fire a tracked event from any client component (PRD §24 event list). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };
  w.gtag?.("event", name, params);
  w.dataLayer?.push({ event: name, ...params });
  const metaMap: Record<string, string> = {
    contact_submit: "Lead",
    quote_request: "Lead",
    order_initiated: "InitiateCheckout",
    payment_completed: "Purchase",
    sign_up: "CompleteRegistration",
  };
  if (metaMap[name]) w.fbq?.("track", metaMap[name], params);
}
