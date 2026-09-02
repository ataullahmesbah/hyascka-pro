"use client";

import * as React from "react";

import { sendMessageAction } from "@/actions/messages";
import { ActionForm, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { Checkbox, Field, Textarea } from "@/components/ui/field";
import { cn, initials, relativeTime } from "@/lib/utils";

export type ThreadMessage = {
  id: string;
  body: string;
  isInternalNote: boolean;
  createdAt: string;
  senderId: string;
  senderName: string;
  senderRole: string;
};

export function MessageThread({
  conversationId,
  currentUserId,
  canPostInternal,
  messages,
}: {
  conversationId: string;
  currentUserId: string;
  canPostInternal: boolean;
  messages: ThreadMessage[];
}) {
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex flex-col">
      <div className="scrollbar-thin max-h-[28rem] space-y-4 overflow-y-auto pr-1">
        {messages.length ? (
          messages.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <div key={message.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    mine ? "brand-gradient text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  {initials(message.senderName)}
                </span>
                <div className={cn("max-w-[75%]", mine && "text-right")}>
                  <div
                    className={cn(
                      "inline-block rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed",
                      message.isInternalNote
                        ? "border border-warning/40 bg-warning/10 text-foreground"
                        : mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                    )}
                  >
                    {message.isInternalNote ? (
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-warning">
                        Internal note — not visible to the client
                      </span>
                    ) : null}
                    <span className="whitespace-pre-wrap">{message.body}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {message.senderName} · {relativeTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet — start the conversation below.
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <ActionForm action={sendMessageAction} successTitle="Message sent" resetOnSuccess>
          <input type="hidden" name="conversationId" value={conversationId} />
          <BodyField />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {canPostInternal ? (
              <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Checkbox name="isInternalNote" />
                Internal note (staff only)
              </label>
            ) : (
              <span />
            )}
            <SubmitButton pendingLabel="Sending…">Send message</SubmitButton>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}

function BodyField() {
  return (
    <Field label="Message" htmlFor="body" error={useFieldError("body")}>
      <Textarea id="body" name="body" rows={3} required placeholder="Write your message…" />
    </Field>
  );
}
