import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { JsonLd, PageHeader } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { getPosts } from "@/lib/content";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Blog",
    description:
      "Practical notes on web performance, security, search and building measurable digital platforms.",
    path: "/blog",
  });
}

export default async function BlogPage() {
  const posts = await getPosts();
  const [featured, ...rest] = posts;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />
      <PageHeader
        eyebrow="Insights"
        title="What we have learned, written down"
        description="Notes from actual engagements — performance, security, search and the operational side of running a digital business."
      />

      <section className="section">
        <div className="container">
          {featured ? (
            <Reveal>
              <Link
                href={`/blog/${featured.slug}`}
                className="group grid gap-6 rounded-2xl border border-border bg-card p-7 transition-all hover:border-primary/40 hover:shadow-elevated md:grid-cols-[1.4fr_0.6fr] md:p-10"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone="primary">{featured.categoryName}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(featured.publishedAt)} · {featured.readMinutes} min read
                    </span>
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-bold leading-snug md:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {featured.excerpt}
                  </p>
                  <span className="mt-5 inline-block text-sm font-semibold text-primary">
                    Read the article →
                  </span>
                </div>
                <div className="hidden items-center justify-center md:flex">
                  <span className="brand-gradient flex h-28 w-28 items-center justify-center rounded-2xl font-display text-3xl font-extrabold text-white">
                    {featured.readMinutes}′
                  </span>
                </div>
              </Link>
            </Reveal>
          ) : null}

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, index) => (
              <Reveal key={post.slug} as="article" delay={(index % 3) * 60}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated motion-reduce:hover:translate-y-0"
                >
                  <Badge tone="outline" className="w-fit">
                    {post.categoryName}
                  </Badge>
                  <h2 className="mt-4 font-display text-lg font-semibold leading-snug">{post.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <p className="mt-5 text-xs text-muted-foreground">
                    {formatDate(post.publishedAt)} · {post.readMinutes} min read
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
