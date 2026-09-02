import { DashboardHeader } from "@/components/dashboard/page-shell";
import { PostEditor } from "@/components/dashboard/content-forms";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requirePermission("content.manage");
  return (
    <>
      <DashboardHeader
        title="New article"
        breadcrumbs={[{ label: "Content" }, { label: "Blog", href: "/dashboard/content/blog" }, { label: "New" }]}
      />
      <PostEditor
        draft={{
          coverImage: "",
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          categoryName: "Insights",
          readMinutes: "5",
          status: "DRAFT",
          metaTitle: "",
          metaDescription: "",
        }}
      />
    </>
  );
}
