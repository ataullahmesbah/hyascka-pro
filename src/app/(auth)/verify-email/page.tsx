import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { verifyEmailAction } from "@/actions/auth";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ title: "Verify email", path: "/verify-email", noIndex: true });
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const verified = token ? await verifyEmailAction(token) : false;

  return (
    <div className="text-center">
      {verified ? (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-5 font-display text-2xl font-bold">Email verified</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Your address is confirmed. You can head to your dashboard.
          </p>
          <ButtonLink href="/dashboard" className="mt-7">
            Go to dashboard
          </ButtonLink>
        </>
      ) : (
        <>
          <XCircle className="mx-auto h-12 w-12 text-danger" />
          <h1 className="mt-5 font-display text-2xl font-bold">Link expired or invalid</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Verification links are valid for 24 hours and can be used once. Sign in and request a new
            one from your profile.
          </p>
          <ButtonLink href="/login" className="mt-7">
            Sign in
          </ButtonLink>
          <p className="mt-5 text-xs text-ink-muted">
            Still stuck?{" "}
            <Link href="/support" className="text-accent hover:underline">
              Contact support
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
