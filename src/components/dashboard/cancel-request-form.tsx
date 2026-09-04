"use client";

import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { Field, Textarea } from "@/components/ui/field";
import { requestCancellationAction } from "@/actions/requests";

/**
 * Withdrawing a request.
 *
 * Before work is committed this cancels outright; once it is, the same form
 * raises the question and staff answer in the thread. The wording says so,
 * because "cancel" that quietly turns into "asked to cancel" is worse than
 * saying it upfront.
 */
export function CancelRequestForm({ requestId }: { requestId: string }) {
  return (
    <ActionForm action={requestCancellationAction} successTitle="Sent">
      <input type="hidden" name="requestId" value={requestId} />
      <Field
        label="Reason"
        htmlFor={`cancel-${requestId}`}
        hint="If we have not started, this cancels straight away. If work is under way, we will pick it up with you in the conversation."
      >
        <Textarea
          id={`cancel-${requestId}`}
          name="reason"
          rows={3}
          placeholder="Tell us what changed…"
          required
        />
      </Field>
      <SubmitButton variant="danger">Cancel this request</SubmitButton>
    </ActionForm>
  );
}
