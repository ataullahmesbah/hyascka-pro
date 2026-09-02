import type { Metadata } from "next";

import { JsonLd, PageHeader } from "@/components/ui/section";
import { FeaturedPostCard, PostCard } from "@/components/marketing/post-card";
import { Reveal } from "@/components/ui/reveal";
import { getPosts } from "@/lib/content";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

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
        <div className="container-x">
          {featured ? (
            <Reveal>
              <FeaturedPostCard post={featured} />
            </Reveal>
          ) : null}

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, index) => (
              <Reveal key={post.slug} as="article" delay={(index % 3) * 60}>
                <PostCard post={post} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
