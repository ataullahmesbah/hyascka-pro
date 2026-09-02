import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { ArchiveButton } from "@/components/dashboard/content-forms";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, LinkCell, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BlogAdminPage() {
  await requirePermission("content.manage");

  const posts = await prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    include: { category: { select: { name: true } }, author: { select: { name: true } } },
  });

  return (
    <>
      <DashboardHeader
        title="Blog"
        description="Articles published on the public site."
        breadcrumbs={[{ label: "Content" }, { label: "Blog" }]}
        actions={
          <ButtonLink href="/dashboard/content/blog/new" size="sm">
            New article
          </ButtonLink>
        }
      />

      <Panel>
        {posts.length ? (
          <TableWrap className="border-0">
            <Table className="min-w-[48rem]">
              <thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Category</Th>
                  <Th>Author</Th>
                  <Th>Updated</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <Tr key={post.id}>
                    <Td>
                      <LinkCell href={`/dashboard/content/blog/${post.id}`}>{post.title}</LinkCell>
                      <p className="text-xs text-ink-muted">/blog/{post.slug}</p>
                    </Td>
                    <Td className="text-ink-muted">{post.category?.name ?? "—"}</Td>
                    <Td className="text-ink-muted">{post.author?.name ?? "—"}</Td>
                    <Td className="whitespace-nowrap text-ink-muted">{formatDate(post.updatedAt)}</Td>
                    <Td>
                      <StatusBadge status={post.status} />
                    </Td>
                    <Td>
                      {post.status !== "ARCHIVED" ? <ArchiveButton entity="post" id={post.id} /> : null}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState
            icon="Newspaper"
            title="No articles yet"
            action={{ label: "Write the first one", href: "/dashboard/content/blog/new" }}
          />
        )}
      </Panel>
    </>
  );
}
