import Link from "next/link";

import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { EmptyState } from "@/components/ui/table";
import { requireUser } from "@/lib/auth/guards";
import { conversationsFor } from "@/lib/dashboard-data";
import { relativeTime, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await requireUser();
  const conversations = await conversationsFor(user);

  return (
    <>
      <DashboardHeader
        title="Messages"
        description={
          user.role === "CLIENT"
            ? "Your conversations with the HYASCKA team."
            : "Client conversations. Internal notes are never visible to clients."
        }
      />

      <Panel>
        {conversations.length ? (
          <ul className="divide-y divide-border">
            {conversations.map((conversation) => {
              const latest = conversation.messages[0];
              return (
                <li key={conversation.id}>
                  <Link
                    href={`/dashboard/messages/${conversation.id}`}
                    className="-mx-2 flex items-start gap-4 rounded-lg px-2 py-4 transition-colors hover:bg-muted/60"
                  >
                    <span className="brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                      {conversation.subject.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{conversation.subject}</span>
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {latest ? truncate(latest.body, 110) : "No messages yet."}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {conversation.participants.map((p) => p.user.name).join(", ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {relativeTime(conversation.lastMessageAt)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon="MessageSquare"
            title="No conversations yet"
            description="Project conversations appear here once work starts."
          />
        )}
      </Panel>
    </>
  );
}
