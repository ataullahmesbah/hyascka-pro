"use client";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#0b1020",
          color: "#e8ecf7",
          fontFamily: "system-ui, sans-serif",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>HYASCKA is temporarily unavailable</h1>
          <p style={{ color: "#96a0bc", marginTop: "0.75rem", fontSize: "0.9rem" }}>
            A critical error stopped the application from rendering. Please try again shortly.
          </p>
          {error.digest ? (
            <p style={{ color: "#6d7896", marginTop: "0.75rem", fontSize: "0.75rem" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          {/* A plain anchor is required here: global-error renders outside the
              app shell, where the Next.js router is not available. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: "1.5rem",
              padding: "0.7rem 1.4rem",
              borderRadius: "999px",
              background: "linear-gradient(110deg,#22e4ff,#7b45f0)",
              color: "#07101f",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Reload
          </a>
        </div>
      </body>
    </html>
  );
}
