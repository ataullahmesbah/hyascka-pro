import Image from "next/image";

import { cn } from "@/lib/utils";

export type SponsorItem = { id: string; label: string; imageUrl?: string; href?: string };

export type SponsorsContent = {
  enabled: boolean;
  title: string;
  direction: "left" | "right";
  speed: number;
  items: SponsorItem[];
};

/**
 * Partner marquee (PRD §4). Server-rendered, CSS-driven, no JavaScript: the
 * track is duplicated and translated by exactly -50%, which loops seamlessly.
 * The duplicate is hidden from assistive tech so names are not read twice.
 */
export function Sponsors({ content }: { content: SponsorsContent }) {
  if (!content.enabled || !content.items.length) return null;

  const duration = `${Math.max(12, content.speed)}s`;
  const animation = content.direction === "right" ? "hy-marquee-reverse" : "hy-marquee";

  return (
    <section className="border-b border-line bg-bg-subtle py-9" aria-label="Partners and clients">
      <div className="container-x">
        <p className="text-center text-step--2 font-semibold uppercase tracking-wide text-ink-soft">
          {content.title}
        </p>
      </div>

      <div
        className="group relative mt-6 overflow-hidden"
        style={{
          maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        }}
      >
        <div
          className="flex w-max items-center gap-12 motion-reduce:animate-none group-hover:[animation-play-state:paused]"
          style={{ animation: `${animation} ${duration} linear infinite` }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-12" aria-hidden={copy === 1 ? true : undefined}>
              {content.items.map((item) => (
                <SponsorMark key={`${copy}-${item.id}`} item={item} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SponsorMark({ item }: { item: SponsorItem }) {
  const inner = item.imageUrl ? (
    <Image
      src={item.imageUrl}
      alt={item.label}
      width={160}
      height={40}
      className="h-8 w-auto object-contain opacity-65 transition-opacity duration-fast hover:opacity-100"
    />
  ) : (
    <span
      className={cn(
        "whitespace-nowrap font-display text-step-1 font-semibold text-ink-soft",
        "transition-colors duration-fast hover:text-ink",
      )}
    >
      {item.label}
    </span>
  );

  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="shrink-0">
        {inner}
      </a>
    );
  }
  return <span className="shrink-0">{inner}</span>;
}
