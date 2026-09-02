import { cn } from "@/lib/utils";

/**
 * The global-network hero visual (PRD §4).
 *
 * Deliberately pure, deterministic SVG rendered on the server: no WebGL, no
 * canvas, no animation library, nothing to hydrate. It stays sharp at any
 * density, costs a few kilobytes, and every colour resolves through the theme
 * tokens so it re-skins with the rest of the product.
 *
 * Motion is CSS-only and disappears entirely under `prefers-reduced-motion`.
 */

/** Deterministic PRNG so the server and the client agree on every coordinate. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

type Point = { x: number; y: number; z: number; r: number };

/**
 * Fibonacci lattice: the standard way to place N points near-evenly on a
 * sphere. Latitude banding bunches dots at the poles and leaves visible seams;
 * this does not, which is what makes the globe read as a solid object.
 */
function buildGlobe(radius: number, count: number, seed: number): Point[] {
  const random = seeded(seed);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const points: Point[] = [];

  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2; // 1 → -1
    const bandRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i + random() * 0.05;

    const z = Math.sin(theta) * bandRadius;
    // Orthographic projection keeps the facing hemisphere; a little of the far
    // side is retained so the silhouette does not look cut off.
    if (z < -0.25) continue;

    points.push({
      x: Math.cos(theta) * bandRadius * radius,
      y: y * radius,
      z: z * radius,
      r: 0.9 + z * 1.15,
    });
  }
  return points;
}

export function NetworkVisual({ className }: { className?: string }) {
  const size = 460;
  const c = size / 2;
  const radius = size * 0.39;
  const points = buildGlobe(radius, 460, 20260902);

  // Group by depth so the sphere still reads as volume, then emit one path per
  // group. An arc pair draws a full circle: M cx-r cy a r r 0 1 0 2r 0 a ...
  const BUCKETS = 6;
  const buckets = Array.from({ length: BUCKETS }, (_, level) => {
    const opacity = Number((0.22 + (level / (BUCKETS - 1)) * 0.74).toFixed(2));
    const parts: string[] = [];
    for (const p of points) {
      const depth = (p.z + radius) / (radius * 2);
      if (Math.min(BUCKETS - 1, Math.floor(depth * BUCKETS)) !== level) continue;
      const r = Math.max(0.6, Number(p.r.toFixed(2)));
      const x = Number((c + p.x).toFixed(1));
      const y = Number((c + p.y).toFixed(1));
      parts.push(`M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`);
    }
    return { opacity, d: parts.join("") };
  }).filter((bucket) => bucket.d.length > 0);

  // A handful of nodes carry the "live connection" story.
  const random = seeded(77);
  const hubs = points
    .filter((p) => p.z > radius * 0.25)
    .filter(() => random() > 0.965)
    .slice(0, 8);

  const arcs = hubs.slice(0, 6).map((from, index) => {
    const to = hubs[(index + 3) % hubs.length];
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    // Bow the arc outward from the globe centre so it reads as a flight path.
    const lift = 1.32;
    return {
      id: `${index}`,
      d: `M ${c + from.x} ${c + from.y} Q ${c + mx * lift} ${c + my * lift} ${c + to.x} ${c + to.y}`,
      delay: index * 0.9,
    };
  });

  return (
    <div className={cn("relative aspect-square w-full", className)} aria-hidden>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full overflow-visible">
        <defs>
          <radialGradient id="hy-globe-core" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.20" />
            <stop offset="65%" stopColor="hsl(var(--accent))" stopOpacity="0.05" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hy-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--node))" stopOpacity="0" />
            <stop offset="45%" stopColor="hsl(var(--node))" stopOpacity="0.85" />
            <stop offset="100%" stopColor="hsl(var(--arc))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Soft core so the dot sphere reads as volume rather than confetti */}
        <circle cx={c} cy={c} r={radius * 1.32} fill="url(#hy-globe-core)" />

        {/* Orbit rings */}
        <ellipse
          cx={c}
          cy={c}
          rx={radius * 1.16}
          ry={radius * 0.4}
          fill="none"
          stroke="hsl(var(--accent) / 0.3)"
          strokeWidth="1"
        />
        <ellipse
          cx={c}
          cy={c}
          rx={radius * 1.16}
          ry={radius * 0.4}
          fill="none"
          stroke="hsl(var(--accent) / 0.18)"
          strokeWidth="1"
          transform={`rotate(58 ${c} ${c})`}
        />

        {/*
          The globe. Dots are grouped into a few opacity buckets and each bucket
          is drawn as ONE path of circular sub-paths. Six nodes instead of
          several hundred keeps the DOM small, which matters for both parse cost
          and Lighthouse's DOM-size budget.
        */}
        <g>
          {buckets.map((bucket) => (
            <path key={bucket.opacity} d={bucket.d} fill="hsl(var(--node))" opacity={bucket.opacity} />
          ))}
        </g>

        {/* Connection arcs */}
        <g fill="none" stroke="url(#hy-arc)" strokeWidth="1.4" strokeLinecap="round">
          {arcs.map((arc) => (
            <path
              key={arc.id}
              d={arc.d}
              style={{
                strokeDasharray: "6 240",
                animation: `hy-dash 9s linear ${arc.delay}s infinite`,
              }}
            />
          ))}
        </g>

        {/* Pulsing hubs */}
        <g>
          {hubs.map((hub, index) => (
            <g key={`hub-${index}`}>
              <circle
                cx={c + hub.x}
                cy={c + hub.y}
                r="7"
                fill="hsl(var(--node) / 0.28)"
                style={{ animation: `hy-pulse-node 3.4s ease-in-out ${index * 0.42}s infinite` }}
              />
              <circle cx={c + hub.x} cy={c + hub.y} r="2.4" fill="hsl(var(--node))" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

/**
 * The hexagon mesh used behind section dividers — the second half of the brand
 * reference. Tiled via a pattern so it costs nothing to repeat.
 */
export function HexTexture({ className }: { className?: string }) {
  return (
    <svg className={cn("h-full w-full", className)} aria-hidden>
      <defs>
        <pattern id="hy-hex" width="56" height="97" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
          <path
            d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 64 L56 80 L56 112 M28 64 L0 80 L0 112"
            fill="none"
            stroke="hsl(var(--grid-line))"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hy-hex)" />
    </svg>
  );
}
