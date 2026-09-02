import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { legalPages } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Terms of Service",
    description: "The terms governing use of the HYASCKA website, client platform and services.",
    path: "/terms",
  });
}

export default function Page() {
  return <LegalPage content={legalPages.terms} path="/terms" />;
}
