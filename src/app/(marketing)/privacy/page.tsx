import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { legalPages } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Privacy Policy",
    description: "What personal data HYASCKA collects, why we collect it, and the control you have over it.",
    path: "/privacy",
  });
}

export default function Page() {
  return <LegalPage content={legalPages.privacy} path="/privacy" />;
}
