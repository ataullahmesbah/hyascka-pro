import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Security headers applied to every response (PRD §20, §41.2).
 * The CSP is intentionally strict: only self-hosted code plus the small,
 * explicitly named set of hosts the tracking stack (PRD §44) needs.
 */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js injects inline bootstrap scripts; tracking hosts are the ones
      // named in PRD §44.
      //
      // `unsafe-eval` in development only, and it is not optional there: the
      // dev bundler serves modules through eval(), so without it the browser
      // silently refuses to run *any* client JavaScript — no menus, no
      // toggles, no forms — while the server-rendered page looks perfectly
      // fine. Production never gets it.
      [
        "script-src 'self' 'unsafe-inline'",
        isDev ? "'unsafe-eval'" : "",
        "https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.clarity.ms",
      ]
        .filter(Boolean)
        .join(" "),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://www.google-analytics.com https://www.facebook.com https://c.clarity.ms",
      "font-src 'self' data:",
      // The dev server pushes hot-reload updates over a websocket.
      [
        "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://graph.facebook.com https://*.clarity.ms",
        isDev ? "ws: http://localhost:*" : "",
      ]
        .filter(Boolean)
        .join(" "),
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
