import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { legalPages } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Refund Policy",
    description: "How refunds work for HYASCKA project work, retainers and deposits.",
    path: "/refund-policy",
  });
}

export default function Page() {
  return <LegalPage content={legalPages.refund} path="/refund-policy" />;
}
