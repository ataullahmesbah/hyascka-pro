"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Route-level error boundary. Internal details are never rendered — only the
 * digest, which is safe to quote to support (PRD §21).
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[boundary]", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/12 text-danger">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The page could not be loaded. This has been logged. Try again, and if it keeps happening,
          send us the reference below.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="outline">
            Back to home
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
