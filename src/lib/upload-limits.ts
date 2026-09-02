/**
 * Upload limits and per-slot dimension guidance (PRD §6.7).
 *
 * Kept out of the storage adapter deliberately: the adapter is `server-only`,
 * but the dashboard upload control needs these numbers in the browser to give
 * an editor an answer before the request is made rather than after it fails.
 */
export const UPLOAD_LIMITS = {
  image: {
    maxBytes: 5 * 1024 * 1024,
    label: "5 MB",
    types: ["image/png", "image/jpeg", "image/webp", "image/avif", "image/svg+xml"],
    accept: "image/png,image/jpeg,image/webp,image/avif,image/svg+xml",
    hint: "JPG, PNG, WebP, AVIF or SVG · up to 5 MB",
  },
  document: {
    maxBytes: 10 * 1024 * 1024,
    label: "10 MB",
    types: ["application/pdf"],
    accept: "application/pdf",
    hint: "PDF · up to 10 MB",
  },
} as const;

/** Recommended pixel dimensions per slot, shown inline next to each field. */
export const IMAGE_GUIDANCE = {
  heroSlide: "1600 × 1200 px, landscape",
  sponsorLogo: "320 × 80 px, transparent PNG or SVG",
  serviceCover: "1200 × 675 px (16:9)",
  caseStudyCover: "1200 × 675 px (16:9)",
  blogCover: "1200 × 675 px (16:9)",
  avatar: "400 × 400 px, square",
  ogImage: "1200 × 630 px",
  logo: "512 × 512 px, transparent",
} as const;
