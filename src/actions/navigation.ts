"use server";

import { revalidatePath } from "next/cache";

import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { navigationItemSchema, toActionState, type ActionState } from "@/lib/validation";

/**
 * Header and footer links, editable from the dashboard (PRD v5.1 §5).
 *
 * These drive the real navigation — the marketing layout reads the same rows —
 * so an admin can add a page to the menu without a developer.
 */
export async function saveNavigationItemAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("content.manage");

  const parsed = navigationItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { id, ...data } = parsed.data;

  const row = id
    ? await prisma.navigationItem.update({ where: { id }, data, select: { id: true, label: true } })
    : await prisma.navigationItem.create({ data, select: { id: true, label: true } });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: id ? "content.updated" : "content.created",
    entityType: "NavigationItem",
    entityId: row.id,
    summary: `Navigation link "${row.label}" ${id ? "updated" : "added"}`,
  });

  revalidatePath("/dashboard/content/navigation");
  revalidatePath("/", "layout");
  return { ok: true, message: `Link "${row.label}" saved.`, data: { id: row.id } };
}

export async function deleteNavigationItemAction(id: string) {
  const user = await authorize("content.manage");

  const row = await prisma.navigationItem.delete({
    where: { id },
    select: { label: true },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "content.deleted",
    entityType: "NavigationItem",
    entityId: id,
    summary: `Navigation link "${row.label}" removed`,
  });

  revalidatePath("/dashboard/content/navigation");
  revalidatePath("/", "layout");
}

/** Moves a link up or down within its own menu. */
export async function moveNavigationItemAction(id: string, direction: "up" | "down") {
  await authorize("content.manage");

  const item = await prisma.navigationItem.findUnique({ where: { id } });
  if (!item) return;

  const neighbour = await prisma.navigationItem.findFirst({
    where: {
      location: item.location,
      position: direction === "up" ? { lt: item.position } : { gt: item.position },
    },
    orderBy: { position: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;

  // Swap the two positions in one transaction so the list can never end up
  // with a duplicate or a gap.
  await prisma.$transaction([
    prisma.navigationItem.update({ where: { id: item.id }, data: { position: neighbour.position } }),
    prisma.navigationItem.update({ where: { id: neighbour.id }, data: { position: item.position } }),
  ]);

  revalidatePath("/dashboard/content/navigation");
  revalidatePath("/", "layout");
}
