import Link from "next/link";

import { AnnouncementDismiss } from "@/components/marketing/announcement-dismiss";

const ELEMENT_ID = "hy-announcement";

/** Escapes a value for safe interpolation into an inline <script>. */
function jsonForScript(value: string) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/**
 * Dismissible campaign strip above the navigation.
 *
 * Server-rendered on purpose. The previous version started hidden and revealed
 * itself from an effect, which meant the bar appeared only after hydration:
 * it pushed the whole page down (layout shift) and, because it is a full-width
 * band of text, it became the largest contentful paint at ~2.6s on throttled
 * mobile. Now the markup ships in the HTML and a synchronous script hides it
 * before first paint if this visitor already dismissed this exact message.
 */
export function AnnouncementBar({
  text,
  href,
  linkLabel,
  storageKey = "hyascka.announcement",
}: {
  text: string;
  href?: string;
  linkLabel?: string;
  storageKey?: string;
}) {
  // Runs before paint and marks the document instead of touching the bar: the
  // CSS below does the hiding, so this works no matter where React ends up
  // placing the script, and never mutates a node React is about to hydrate.
  const hideIfDismissed = `(function(){try{if(sessionStorage.getItem(${jsonForScript(
    storageKey,
  )})===${jsonForScript(
    text,
  )})document.documentElement.setAttribute("data-announcement-dismissed","")}catch(e){}})();`;

  return (
    <>
      <div
        id={ELEMENT_ID}
        className="relative border-b border-accent-border/50 bg-accent-soft text-accent"
      >
        <div className="container-x flex items-center justify-center gap-3 py-2 pr-8 text-center text-step--2 font-medium">
          <p>
            {text}{" "}
            {href ? (
              <Link href={href} className="underline underline-offset-4">
                {linkLabel ?? "Learn more"}
              </Link>
            ) : null}
          </p>
          <AnnouncementDismiss storageKey={storageKey} value={text} />
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: hideIfDismissed }} />
    </>
  );
}
