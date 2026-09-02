import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostSeed } from "@/content/types";

/**
 * Cover art for an article.
 *
 * A post without an uploaded image still needs to look deliberate rather than
 * broken, so it falls back to a tinted panel carrying the category — derived
 * from the slug so the same article always gets the same tint.
 */
function Cover({
  post,
  className,
  sizes,
  priority = false,
}: {
  post: PostSeed;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  if (post.coverImage) {
    return (
      <div className={cn("relative overflow-hidden bg-surface-2", className)}>
        <Image
          src={post.coverImage}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          // Without Cloudinary configured, uploads are stored inline as data
          // URIs, which the image optimiser cannot fetch and resize.
          unoptimized={post.coverImage.startsWith("data:")}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none"
        />
      </div>
    );
  }

  const hue = [...post.slug].reduce((total, char) => total + char.charCodeAt(0), 0) % 360;
  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 70% 92%), hsl(${(hue + 40) % 360} 65% 84%))`,
      }}
      aria-hidden
    >
      <span className="font-display text-step-2 font-bold text-ink/35">{post.categoryName}</span>
    </div>
  );
}

/** The lead article on the blog index. */
export function FeaturedPostCard({ post }: { post: PostSeed }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid overflow-hidden rounded-2xl border border-line bg-surface transition-all hover:border-accent-border hover:shadow-lg md:grid-cols-2"
    >
      <Cover
        post={post}
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
        className="aspect-[16/10] md:aspect-auto md:min-h-[19rem]"
      />
      <div className="flex flex-col justify-center p-7 md:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="accent">{post.categoryName}</Badge>
          <span className="text-step--2 text-ink-muted">
            {formatDate(post.publishedAt)} · {post.readMinutes} min read
          </span>
        </div>
        <h2 className="mt-4 font-display text-step-3 font-bold leading-snug tracking-tight">
          {post.title}
        </h2>
        <p className="mt-3 line-clamp-3 text-step-0 leading-relaxed text-ink-soft">
          {post.excerpt}
        </p>
        <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-btn border border-line-strong px-4 py-2 text-step--1 font-semibold text-ink transition-colors group-hover:border-accent-border group-hover:bg-accent-soft group-hover:text-accent">
          Read article
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/** A card in the blog grid: cover, category, title, summary, meta and a button. */
export function PostCard({ post }: { post: PostSeed }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all hover:-translate-y-1 hover:border-accent-border hover:shadow-lg motion-reduce:hover:translate-y-0"
    >
      <Cover post={post} sizes="(max-width: 768px) 100vw, 33vw" className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col p-5">
        <Badge tone="outline" className="w-fit">
          {post.categoryName}
        </Badge>
        <h2 className="mt-3 font-display text-step-1 font-semibold leading-snug">{post.title}</h2>
        <p className="mt-2 line-clamp-3 flex-1 text-step--1 leading-relaxed text-ink-soft">
          {post.excerpt}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          <span className="text-step--2 text-ink-muted">
            {formatDate(post.publishedAt)} · {post.readMinutes} min
          </span>
          <span className="inline-flex items-center gap-1.5 text-step--1 font-semibold text-accent">
            Read
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
