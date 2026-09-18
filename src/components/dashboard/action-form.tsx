"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
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
  successHref,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  successTitle?: string;
  resetOnSuccess?: boolean;
  /** Where to go once the save succeeds — usually the list this row belongs to. */
  successHref?: string;
}) {
  const router = useRouter();
  const [state, dispatch] = useActionState(action, null);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const seen = React.useRef<ActionState | null>(null);
  /*
   * What was last submitted, so a rejected save can be put back.
   *
   * React empties an uncontrolled form once its action resolves, whether the
   * action succeeded or not. On a refusal — a slug already taken, a field the
   * server disliked — that threw away everything typed and left the person
   * facing a blank form and an error about copy they could no longer see.
   */
  const submitted = React.useRef<FormData | null>(null);

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
    if (state.ok) {
      if (resetOnSuccess) formRef.current?.reset();
      // The toast lives above the route, so it survives the navigation and is
      // still readable on the list the person lands on.
      if (successHref) router.push(successHref);
      return;
    }
    restoreForm(formRef.current, submitted.current);
  }, [state, toast, successTitle, resetOnSuccess, successHref, router]);

  return (
    <FormStateContext.Provider value={state}>
      <form
        ref={formRef}
        action={(formData) => {
          submitted.current = formData;
          dispatch(formData);
        }}
        className={cn("space-y-5", className)}
        noValidate
      >
        {children}
      </form>
    </FormStateContext.Provider>
  );
}

/** Writes a submission back into the fields React has just emptied. */
function restoreForm(form: HTMLFormElement | null, values: FormData | null) {
  if (!form || !values) return;

  for (const field of Array.from(form.elements)) {
    const editable =
      field instanceof HTMLInputElement ||
      field instanceof HTMLTextAreaElement ||
      field instanceof HTMLSelectElement;
    if (!editable || !field.name) continue;

    if (field instanceof HTMLInputElement) {
      // A file input cannot be written to, and nothing typed is lost from one.
      if (field.type === "file") continue;
      if (field.type === "checkbox" || field.type === "radio") {
        // Unchecked boxes are absent from FormData, which is the answer itself.
        field.checked = values.getAll(field.name).includes(field.value);
        continue;
      }
    }

    const value = values.get(field.name);
    if (typeof value === "string") field.value = value;
  }
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
