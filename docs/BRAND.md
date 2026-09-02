# HYASCKA — Brand style guide

One page, so anyone applying the brand later stays consistent.

## The mark

A faceted, bevelled **H**: two upright columns with a diagonal crossbar sweeping from the
lower left to the upper right, filled with the cyan → blue → purple gradient.

| File | Use |
|---|---|
| `public/brand/logo-icon.svg` | The primary mark. Vector, scales to any size. |
| `public/brand/logo-icon-compact.svg` | Small-size variant: bolder strokes, no thin bevels. Used for 16–48 px favicons. |
| `public/brand/logo-lockup.svg` | Horizontal lockup — icon left, wordmark right. For headers and collateral. |
| `public/brand/logo-icon-transparent-192.png` / `-512.png` | Transparent-background raster exports. |
| `public/brand/hero-fallback.png` | Static hero mark with glow, shown for reduced-motion users and where WebGL fails. |

The navbar uses the icon-only mark at ~36 px beside the wordmark set in type — never the
stacked lockup, which is too tall for a navigation bar.

## Favicon kit

| File | Size | Context |
|---|---|---|
| `favicon.ico` | 16 / 32 / 48 | Browser tab, legacy |
| `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png` | as named | Browser tab |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `android-chrome-192x192.png`, `android-chrome-512x512.png` | as named | Android / PWA (`site.webmanifest`) |
| `og-image.png` | 1200×630 | Social sharing |

Small sizes use the compact variant, because the thinnest bevel edges merge below ~32 px.

## Colour

The gradient is a **design token**, applied identically to the logo, buttons, borders and
icon fills. Never eyeball it per asset.

| Stop | Hex | Token |
|---|---|---|
| Cyan (start) | `#22E4FF` | `--grad-from` |
| Blue (mid) | `#3E71F4` | `--grad-via` |
| Purple (end) | `#7B45F0` | `--grad-to` |

Two accent identities ship, switchable from Dashboard → Settings → Theme:

| Identity | Primary (light) | Primary (dark) |
|---|---|---|
| Purple (default) | `hsl(262 83% 58%)` | `hsl(262 90% 70%)` |
| Cyan | `hsl(190 95% 42%)` | `hsl(187 92% 55%)` |

Dark mode uses a soft dark navy (`hsl(226 42% 7%)`), never pure black, so the gradient and
glow stay visible without glare.

Status colours are reserved and never reused as decoration: success, warning, danger, info.

## Typography

| Role | Family | Notes |
|---|---|---|
| Display / headings | Space Grotesk | Variable, `-0.02em` tracking, balanced wrapping |
| Body | Inter | Variable, optimised legibility |

Two families only. Both are variable fonts loaded through `next/font`, self-hosted at
build time — no third-party font request at runtime.

## Clear space and minimum size

- Keep empty padding of at least **0.5× the icon width** on every side.
- Never render the mark below **24 px**; below 32 px use the compact variant.
- On a light surface, place the mark on its own dark rounded chip so the gradient does not
  wash out.

## Do / don't

**Do** use the gradient exactly as tokenised · keep the mark on a dark ground · use the
horizontal lockup in tight spaces · use the compact variant at small sizes.

**Don't** recolour the mark outside the ramp · stretch or rotate it · add a drop shadow or
outline · place it on a busy photograph · rebuild it by hand — use the SVG.

## Still worth commissioning

The mark here is a clean vector rebuild. If a designer revisits it:

- a monochrome version (solid white, solid dark) for single-colour print and embroidery;
- a refined small-size variant beyond the current bolder-stroke version;
- a documented motion treatment for video and social.

None of these block launch.
