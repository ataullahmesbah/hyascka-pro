import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd, PageHeader } from "@/components/ui/section";
import { Markdown } from "@/components/ui/markdown";
import { getPostBySlug, getPosts } from "@/lib/content";
import { articleSchema, breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return pageMetadata({ title: "Article not found", noIndex: true });
  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.publishedAt,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, posts] = await Promise.all([getPostBySlug(slug), getPosts()]);
  if (!post) notFound();

  const related = posts.filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <>
      <JsonLd data={articleSchema(post)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <PageHeader
        eyebrow={`${post.categoryName} · ${formatDate(post.publishedAt)} · ${post.readMinutes} min read`}
        title={post.title}
        description={post.excerpt}
      />

      <article className="section">
        <div className="container max-w-prose">
          <Markdown content={post.content} />

          <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
            {post.tags.map((tag) => (
              <Badge key={tag} tone="outline">
                #{tag}
              </Badge>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-border bg-card p-7 text-center">
            <h2 className="font-display text-xl font-bold">Want this applied to your own site?</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              Send us the URL and what you are trying to improve. We will tell you honestly whether it
              is worth the work.
            </p>
            <ButtonLink href="/contact" className="mt-5">
              Start a conversation
            </ButtonLink>
          </div>
        </div>
      </article>

      {related.length ? (
        <section className="section border-t border-border">
          <div className="container">
            <h2 className="font-display text-2xl font-bold">Keep reading</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/blog/${item.slug}`}
                  className="rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated motion-reduce:hover:translate-y-0"
                >
                  <Badge tone="outline">{item.categoryName}</Badge>
                  <h3 className="mt-3 font-display text-base font-semibold leading-snug">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
