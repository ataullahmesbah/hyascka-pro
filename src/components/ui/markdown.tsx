import * as React from "react";

/**
 * Small, dependency-free renderer for the constrained Markdown subset the CMS
 * accepts (headings, paragraphs, lists, bold, italics, inline code and links).
 *
 * It never injects raw HTML: text is emitted as React nodes, so a malicious
 * paste in the editor cannot become script on the page (PRD §18 sanitisation).
 */
export function Markdown({ content, className }: { content: string; className?: string }) {
  const blocks = content.trim().split(/\n{2,}/);

  return (
    <div className={className ?? "prose prose-neutral max-w-none dark:prose-invert"}>
      {blocks.map((block, index) => {
        const key = `${index}-${block.slice(0, 16)}`;

        if (block.startsWith("### ")) return <h3 key={key}>{inline(block.slice(4))}</h3>;
        if (block.startsWith("## ")) return <h2 key={key}>{inline(block.slice(3))}</h2>;
        if (block.startsWith("# ")) return <h2 key={key}>{inline(block.slice(2))}</h2>;
        if (block.startsWith("> ")) {
          return (
            <blockquote key={key}>
              {inline(block.replace(/^> ?/gm, ""))}
            </blockquote>
          );
        }

        const lines = block.split("\n");
        if (lines.every((line) => /^[-*]\s+/.test(line))) {
          return (
            <ul key={key}>
              {lines.map((line, itemIndex) => (
                <li key={itemIndex}>{inline(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((line) => /^\d+\.\s+/.test(line))) {
          return (
            <ol key={key}>
              {lines.map((line, itemIndex) => (
                <li key={itemIndex}>{inline(line.replace(/^\d+\.\s+/, ""))}</li>
              ))}
            </ol>
          );
        }

        return <p key={key}>{inline(block)}</p>;
      })}
    </div>
  );
}

/** Handles **bold**, *italic*, `code` and [links](https://…). */
function inline(text: string): React.ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  return text.split(pattern).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const href = link[2];
      const external = /^https?:\/\//.test(href);
      return (
        <a
          key={index}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {link[1]}
        </a>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}
