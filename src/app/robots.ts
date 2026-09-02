import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { seo } = await getSettings();
  const blocked = seo.robots.includes("noindex");

  return {
    rules: blocked
      ? [{ userAgent: "*", disallow: "/" }]
      : [
          {
            userAgent: "*",
            allow: "/",
            // Private surfaces are never indexable.
            disallow: ["/dashboard/", "/api/", "/login", "/register", "/reset-password", "/maintenance"],
          },
        ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
