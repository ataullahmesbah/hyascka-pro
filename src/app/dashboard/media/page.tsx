import { DashboardHeader, Panel, StatCard } from "@/components/dashboard/page-shell";
import { EmptyState, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function MediaPage() {
  await requirePermission("media.manage");

  const [assets, totals] = await Promise.all([
    prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { uploadedBy: { select: { name: true } }, folder: { select: { name: true } } },
    }),
    prisma.mediaAsset.aggregate({ _sum: { sizeBytes: true }, _count: true }),
  ]);

  return (
    <>
      <DashboardHeader
        title="Media library"
        description="Assets used across the site. Uploads are optimised automatically when Cloudinary is connected."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Assets" value={totals._count} icon="Image" />
        <StatCard label="Storage used" value={humanSize(Number(totals._sum.sizeBytes ?? 0))} icon="HardDrive" tone="info" />
      </div>

      <Panel title="Assets">
        {assets.length ? (
          <TableWrap className="border-0">
            <Table className="min-w-[44rem]">
              <thead>
                <tr>
                  <Th>File</Th>
                  <Th>Folder</Th>
                  <Th>Alt text</Th>
                  <Th>Size</Th>
                  <Th>Uploaded by</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <Tr key={asset.id}>
                    <Td>
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-accent hover:underline"
                      >
                        {asset.name}
                      </a>
                      <p className="text-xs text-ink-muted">{asset.mimeType}</p>
                    </Td>
                    <Td className="text-ink-muted">{asset.folder?.name ?? "Root"}</Td>
                    <Td className={asset.altText ? "text-ink-muted" : "text-warning"}>
                      {asset.altText ?? "Missing — needed for accessibility"}
                    </Td>
                    <Td className="text-ink-muted">{humanSize(asset.sizeBytes)}</Td>
                    <Td className="text-ink-muted">{asset.uploadedBy?.name ?? "—"}</Td>
                    <Td className="whitespace-nowrap text-ink-muted">{formatDate(asset.createdAt)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState
            icon="Image"
            title="No media uploaded yet"
            description="Connect Cloudinary in Integrations, then upload from any content editor."
          />
        )}
      </Panel>
    </>
  );
}
