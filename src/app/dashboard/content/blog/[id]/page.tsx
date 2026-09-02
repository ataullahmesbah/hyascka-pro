import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/page-shell";
import { PostEditor } from "@/components/dashboard/content-forms";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("content.manage");
  const { id } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { category: { select: { name: true } } },
  });
  if (!post) notFound();

  return (
    <>
      <DashboardHeader
        title={post.title}
        breadcrumbs={[{ label: "Content" }, { label: "Blog", href: "/dashboard/content/blog" }, { label: post.title }]}
        actions={
          <ButtonLink href={`/blog/${post.slug}`} variant="outline" size="sm" target="_blank">
            Preview
          </ButtonLink>
        }
      />
      <PostEditor
        draft={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          categoryName: post.category?.name ?? "Insights",
          readMinutes: String(post.readMinutes),
          status: post.status,
          metaTitle: post.metaTitle ?? "",
          metaDescription: post.metaDescription ?? "",
        }}
      />
    </>
  );
}
