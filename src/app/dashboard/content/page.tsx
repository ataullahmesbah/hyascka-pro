import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";

export default async function ContentIndexPage() {
  await requirePermission("content.read");
  redirect("/dashboard/content/homepage");
}
