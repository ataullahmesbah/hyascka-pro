"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button, type ButtonVariant } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/validation";

type Action = (state: ActionState | null, formData: FormData) => Promise<ActionState>;

const FormStateContext = React.createContext<ActionState | null>(null);

/** Field-level errors returned by the server action, for any child field. */
export function useFieldError(name: string) {
  const state = React.useContext(FormStateContext);
  return state?.fieldErrors?.[name];
}

export function SubmitButton({
  children,
  variant = "primary",
  className,
  pendingLabel = "Saving…",
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} className={className} disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/**
 * Wraps a Server Action with toast feedback (PRD §41.5): success toasts
 * auto-dismiss, errors stay until dismissed.
 */
export function ActionForm({
  action,
  children,
  className,
  successTitle = "Saved",
  resetOnSuccess = false,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  successTitle?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, dispatch] = useActionState(action, null);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const seen = React.useRef<ActionState | null>(null);

  React.useEffect(() => {
    if (!state || state === seen.current) return;
    seen.current = state;
    if (state.message) {
      toast({
        kind: state.ok ? "success" : "error",
        title: state.ok ? successTitle : "Could not save",
        description: state.message,
      });
    }
    if (state.ok && resetOnSuccess) formRef.current?.reset();
  }, [state, toast, successTitle, resetOnSuccess]);

  return (
    <FormStateContext.Provider value={state}>
      <form ref={formRef} action={dispatch} className={cn("space-y-5", className)} noValidate>
        {children}
      </form>
    </FormStateContext.Provider>
  );
}

/** Small inline confirm-then-run button for destructive or one-way actions. */
export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel = "Are you sure?",
  variant = "outline",
  size = "sm",
}: {
  onConfirm: () => Promise<void> | void;
  label: string;
  confirmLabel?: string;
  variant?: ButtonVariant;
  size?: "sm" | "md";
}) {
  const [armed, setArmed] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <Button
      variant={armed ? "danger" : variant}
      size={size}
      disabled={pending}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          return;
        }
        startTransition(async () => {
          await onConfirm();
          setArmed(false);
        });
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {armed ? confirmLabel : label}
    </Button>
  );
}
