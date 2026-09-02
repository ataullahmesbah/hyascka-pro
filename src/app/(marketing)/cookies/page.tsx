import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { legalPages } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Cookie Policy",
    description: "Which cookies this site sets, what they do, and how to change your consent.",
    path: "/cookies",
  });
}

export default function Page() {
  return <LegalPage content={legalPages.cookies} path="/cookies" />;
}
