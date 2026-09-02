"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";

import { subscribeToNewsletter } from "@/actions/public";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} aria-label="Subscribe">
      <Send className={cn("h-4 w-4", pending && "animate-pulse")} />
    </Button>
  );
}

export function NewsletterForm({ className }: { className?: string }) {
  const [state, action] = useActionState(subscribeToNewsletter, null);

  return (
    <form action={action} className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <Input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          className="h-10"
        />
        {/* Honeypot */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <SubmitButton />
      </div>
      {state?.message ? (
        <p
          role="status"
          className={cn("text-xs", state.ok ? "text-success" : "text-danger")}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
