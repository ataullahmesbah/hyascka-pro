import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requireClient } from "@/lib/client-guard";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Contract and document storage alongside invoices (PRD §48.4). */
export default async function MyDocumentsPage() {
  const { clientId } = await requireClient();

  const [documents, projectFiles] = await Promise.all([
    prisma.clientDocument.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } }),
    prisma.projectFile.findMany({
      where: { project: { clientId }, visibleToClient: true },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { name: true } } },
    }),
  ]);

  return (
    <>
      <DashboardHeader
        title="Documents"
        description="Proposals, contracts and project files shared with you."
      />

      <Panel title="Contracts and proposals" className="mb-5">
        {documents.length ? (
          <TableWrap className="border-0">
            <Table className="min-w-[32rem]">
              <thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Category</Th>
                  <Th>Added</Th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <Tr key={document.id}>
                    <Td>
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {document.title}
                      </a>
                    </Td>
                    <Td>
                      <Badge tone="outline">{document.category}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-muted-foreground">{formatDate(document.createdAt)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState icon="FolderArchive" title="No documents yet" description="Contracts and proposals will appear here." />
        )}
      </Panel>

      <Panel title="Project files">
        {projectFiles.length ? (
          <ul className="divide-y divide-border">
            {projectFiles.map((file) => (
              <li key={file.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {file.name}
                  </a>
                  <p className="text-xs text-muted-foreground">{file.project.name}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(file.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No project files shared yet.</p>
        )}
      </Panel>
    </>
  );
}
