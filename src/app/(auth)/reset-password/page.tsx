import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/password-forms";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ title: "Choose a new password", path: "/reset-password", noIndex: true });
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold">Reset link missing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page needs the link from your reset email.{" "}
          <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
            Request a new one
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Setting a new password signs out every other session on your account.
      </p>
      <div className="mt-7">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
