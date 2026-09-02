import { notFound, redirect } from "next/navigation";

import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { MessageThread } from "@/components/dashboard/message-thread";
import { prisma } from "@/lib/db";
import { canAccessConversation, requireUser, toActor } from "@/lib/auth/guards";
import { can } from "@/lib/rbac";
import { markConversationRead } from "@/actions/messages";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  // Membership is enforced before a single message is read (PRD §15).
  if (!(await canAccessConversation(user, id))) redirect("/dashboard?denied=1");

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: { include: { user: { select: { id: true, name: true, role: true } } } },
      messages: {
        // A CLIENT session never receives internal notes in the first place.
        where: user.role === "CLIENT" ? { isInternalNote: false } : {},
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  });
  if (!conversation) notFound();

  await markConversationRead(id);

  return (
    <>
      <DashboardHeader
        title={conversation.subject}
        description={conversation.participants.map((p) => p.user.name).join(" · ")}
        breadcrumbs={[{ label: "Messages", href: "/dashboard/messages" }, { label: conversation.subject }]}
      />

      <Panel className="overflow-hidden">
        <MessageThread
          conversationId={conversation.id}
          currentUserId={user.id}
          canPostInternal={user.role !== "CLIENT" && can(toActor(user), "messages.manage")}
          messages={conversation.messages.map((message) => ({
            id: message.id,
            body: message.body,
            isInternalNote: message.isInternalNote,
            createdAt: message.createdAt.toISOString(),
            senderId: message.sender.id,
            senderName: message.sender.name,
            senderRole: message.sender.role,
          }))}
        />
      </Panel>
    </>
  );
}
