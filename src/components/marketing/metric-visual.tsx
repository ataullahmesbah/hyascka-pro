import { cn } from "@/lib/utils";

/**
 * The reporting slide's visual: a rising line with the labels an agency is
 * actually judged on. Deliberately abstract — it illustrates the claim without
 * inventing a number that would then need defending.
 */
const SERIES = [18, 26, 24, 38, 44, 58, 66, 82];
const W = 640;
const H = 420;

export function MetricVisual({ className }: { className?: string }) {
  const max = Math.max(...SERIES);
  const points = SERIES.map((value, index) => ({
    x: 60 + (index * (W - 110)) / (SERIES.length - 1),
    y: H - 90 - (value / max) * (H - 190),
  }));

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${points[points.length - 1].x} ${H - 90} L${points[0].x} ${H - 90} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label="A rising trend line, illustrating reporting tied to revenue"
    >
      <defs>
        <linearGradient id="mv-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.28" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 1, 2, 3].map((row) => (
        <line
          key={row}
          x1="50"
          x2={W - 40}
          y1={H - 90 - row * ((H - 190) / 3)}
          y2={H - 90 - row * ((H - 190) / 3)}
          stroke="hsl(var(--line))"
          strokeWidth="1"
        />
      ))}

      <path d={area} fill="url(#mv-fill)" />
      <path d={line} fill="none" stroke="hsl(var(--accent))" strokeWidth="2.6" strokeLinecap="round" />

      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={index === points.length - 1 ? 6 : 3.5}
          fill="hsl(var(--accent))"
          stroke="hsl(var(--bg))"
          strokeWidth="2"
        />
      ))}

      <g fontSize="13" fill="hsl(var(--ink-muted))">
        <text x="50" y={H - 62}>Month 1</text>
        <text x={W - 120} y={H - 62}>Month 8</text>
      </g>

      <g transform="translate(50 44)">
        <text fontSize="13" letterSpacing="1.4" fill="hsl(var(--ink-muted))">
          QUALIFIED PIPELINE
        </text>
        <text y="34" fontSize="26" fontWeight="700" fill="hsl(var(--ink))">
          Reported against revenue
        </text>
      </g>
    </svg>
  );
}
