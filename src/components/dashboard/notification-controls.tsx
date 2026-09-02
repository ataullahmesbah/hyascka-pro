"use client";

import * as React from "react";

import { markAllNotificationsRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function MarkAllRead() {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markAllNotificationsRead();
          toast({ kind: "success", title: "All caught up" });
        })
      }
    >
      Mark all as read
    </Button>
  );
}
