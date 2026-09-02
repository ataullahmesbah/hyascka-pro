import { JsonLd, PageHeader } from "@/components/ui/section";
import { breadcrumbSchema } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export type LegalContent = {
  title: string;
  updated: string;
  intro: string;
  sections: { heading: string; body: string }[];
};

export function LegalPage({ content, path }: { content: LegalContent; path: string }) {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: content.title, path },
        ])}
      />
      <PageHeader
        eyebrow={`Last updated ${formatDate(content.updated)}`}
        title={content.title}
        description={content.intro}
      />
      <section className="section">
        <div className="container max-w-prose">
          <div className="prose prose-neutral max-w-none dark:prose-invert">
            {content.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>
          <p className="mt-10 rounded-xl border border-border bg-surface-2/60 p-5 text-sm text-muted-foreground">
            Questions about this policy? Email{" "}
            <a href="mailto:legal@hyascka.com" className="text-primary hover:underline">
              legal@hyascka.com
            </a>{" "}
            and we will respond within 30 days.
          </p>
        </div>
      </section>
    </>
  );
}
