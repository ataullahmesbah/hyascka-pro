"use client";

import { X } from "lucide-react";

/**
 * Only the close button is client-side; the bar itself is server-rendered so it
 * is present in the HTML at first paint.
 */
export function AnnouncementDismiss({
  storageKey,
  value,
}: {
  storageKey: string;
  value: string;
}) {
  return (
    <button
      type="button"
      aria-label="Dismiss announcement"
      onClick={() => {
        try {
          sessionStorage.setItem(storageKey, value);
        } catch {
          // Private-mode browsers reject writes; dismissing for this view still works.
        }
        document.documentElement.setAttribute("data-announcement-dismissed", "");
      }}
      className="absolute right-3 rounded-btn p-2 transition-colors hover:bg-accent/15"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}
