import { cn } from "@/lib/utils";

/**
 * Dot-matrix world map with the places we work marked on it.
 *
 * Drawn rather than imported: a real map image is several hundred kilobytes
 * and needs a licence, and none of the detail survives at this size anyway.
 * Land is approximated as a union of boxes, sampled on a grid — blocky up
 * close, recognisable as a world at the size it is actually shown.
 */

/** [west, east, south, north] in degrees. */
const LAND: Array<[number, number, number, number]> = [
  // North America
  [-168, -140, 55, 71],
  [-140, -60, 50, 70],
  [-125, -70, 30, 50],
  [-110, -83, 15, 30],
  [-55, -20, 60, 83],
  // South America
  [-80, -35, -5, 12],
  [-78, -35, -25, -5],
  [-73, -53, -55, -25],
  // Europe
  [-10, 30, 36, 60],
  [5, 30, 60, 70],
  // Africa
  [-18, 35, 5, 35],
  [8, 42, -5, 5],
  [12, 40, -35, -5],
  // Asia
  [30, 60, 35, 70],
  [60, 140, 45, 72],
  [35, 60, 12, 35],
  [68, 90, 8, 35],
  [95, 125, 20, 45],
  [100, 110, 5, 20],
  [130, 145, 32, 45],
  [95, 140, -10, 5],
  // Oceania
  [113, 153, -39, -11],
  [166, 178, -47, -34],
];

const PINS = [
  { name: "Dhaka", lon: 90.4, lat: 23.8, home: true },
  { name: "London", lon: -0.1, lat: 51.5 },
  { name: "New York", lon: -74.0, lat: 40.7 },
  { name: "Dubai", lon: 55.3, lat: 25.2 },
  { name: "Singapore", lon: 103.8, lat: 1.35 },
  { name: "Sydney", lon: 151.2, lat: -33.9 },
];

const W = 900;
const H = 430;
/*
 * Grid spacing. Every step down multiplies the number of dots, and each dot is
 * a sub-path in the HTML and again in the flight payload — this is the map's
 * whole cost. 4.5° still reads as continents at the size it is shown.
 */
const STEP = 4.5;

/** Equirectangular, cropped to the latitudes that actually contain land. */
function project(lon: number, lat: number) {
  return {
    x: ((lon + 180) / 360) * W,
    y: ((74 - lat) / 130) * H,
  };
}

function isLand(lon: number, lat: number) {
  return LAND.some(([w, e, s, n]) => lon >= w && lon <= e && lat >= s && lat <= n);
}

function dotField() {
  const near: string[] = [];
  const far: string[] = [];

  for (let lat = 74; lat >= -56; lat -= STEP) {
    for (let lon = -180; lon <= 180; lon += STEP) {
      if (!isLand(lon, lat)) continue;
      const { x, y } = project(lon, lat);
      // A dot close to one of the pins is drawn brighter, so the map reads as
      // "these are the places" rather than an even wash.
      const highlighted = PINS.some(
        (pin) => Math.abs(pin.lon - lon) < 14 && Math.abs(pin.lat - lat) < 10,
      );
      /*
       * A dot is a zero-length segment with a round cap, not an arc. Both draw
       * the same circle; "M123 45h.01" is about a fifth of the characters an
       * arc pair costs, and this path is written twice into every response —
       * once as markup and once into the flight payload.
       */
      (highlighted ? near : far).push(`M${Math.round(x)} ${Math.round(y)}h.01`);
    }
  }
  return { near: near.join(""), far: far.join("") };
}

export function WorldMap({ className }: { className?: string }) {
  const { near, far } = dotField();
  const home = PINS.find((pin) => pin.home)!;
  const homePoint = project(home.lon, home.lat);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label="World map marking the cities HYASCKA works across, with its home in Dhaka"
    >
      <defs>
        <radialGradient id="wm-glow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.16" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill="url(#wm-glow)" />

      <path
        d={far}
        fill="none"
        stroke="hsl(var(--ink-muted))"
        strokeOpacity="0.42"
        strokeWidth="5.2"
        strokeLinecap="round"
      />
      <path
        d={near}
        fill="none"
        stroke="hsl(var(--accent))"
        strokeOpacity="0.75"
        strokeWidth="6.8"
        strokeLinecap="round"
      />

      {/* Routes from home to everywhere else. */}
      {PINS.filter((pin) => !pin.home).map((pin) => {
        const point = project(pin.lon, pin.lat);
        const midX = (homePoint.x + point.x) / 2;
        const midY = (homePoint.y + point.y) / 2 - Math.abs(point.x - homePoint.x) * 0.16;
        return (
          <path
            key={pin.name}
            d={`M${homePoint.x} ${homePoint.y}Q${midX} ${midY} ${point.x} ${point.y}`}
            fill="none"
            stroke="hsl(var(--accent))"
            strokeOpacity="0.35"
            strokeWidth="1.1"
            strokeDasharray="4 6"
          />
        );
      })}

      {PINS.map((pin) => {
        const point = project(pin.lon, pin.lat);
        return (
          <g key={pin.name}>
            {pin.home ? (
              <circle cx={point.x} cy={point.y} r="13" fill="hsl(var(--accent))" fillOpacity="0.16">
                <animate
                  attributeName="r"
                  values="9;18;9"
                  dur="3.2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="fill-opacity"
                  values="0.22;0;0.22"
                  dur="3.2s"
                  repeatCount="indefinite"
                />
              </circle>
            ) : null}
            <circle
              cx={point.x}
              cy={point.y}
              r={pin.home ? 5 : 3.4}
              fill="hsl(var(--accent))"
              stroke="hsl(var(--bg))"
              strokeWidth="1.6"
            />
          </g>
        );
      })}

      {/*
        The label the map is really for. It sits on whichever side of the pin
        has room, so it never runs off the edge.
      */}
      {(() => {
        const right = homePoint.x > W * 0.55;
        const boxW = 232;
        const x = right ? homePoint.x - 18 - boxW : homePoint.x + 18;
        const y = homePoint.y - 40;
        return (
          <g transform={`translate(${x} ${y})`}>
            {/* Backing plate, so the label stays legible over the dot field. */}
            <rect
              width={boxW}
              height="62"
              rx="10"
              fill="hsl(var(--bg))"
              fillOpacity="0.86"
              stroke="hsl(var(--line))"
            />
            <text x="16" y="28" fontSize="25" fontWeight="700" letterSpacing="2" fill="hsl(var(--ink))">
              HYASCKA
            </text>
            <text x="16" y="48" fontSize="14" fill="hsl(var(--ink-muted))">
              Dhaka · working worldwide
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
