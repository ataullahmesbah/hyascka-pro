import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ title: "Client Login", path: "/login", noIndex: true });
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const query = await searchParams;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Access your projects, invoices, payments and messages.
      </p>

      {query.reset === "1" ? (
        <p className="mt-5 rounded-lg border border-success/35 bg-success/8 p-3.5 text-sm text-success">
          Your password has been updated. Sign in with your new password.
        </p>
      ) : null}

      <div className="mt-7">
        <LoginForm redirectTo={query.next} />
      </div>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
