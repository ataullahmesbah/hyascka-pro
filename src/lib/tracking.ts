import "server-only";

import { createHash } from "crypto";

import { getServerTrackingConfig } from "@/lib/settings";
import { enqueue } from "@/lib/providers/jobs";

/**
 * Meta Conversions API (PRD §44). Browser pixel events are lost to ad blockers
 * and tracking prevention; sending the same event server-side keeps campaign
 * optimisation accurate. The access token never leaves the server, and no
 * payment data is ever included.
 */

function hash(value?: string | null) {
  if (!value) return undefined;
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export type CapiEvent = {
  eventName: "Lead" | "Purchase" | "CompleteRegistration" | "Contact" | "InitiateCheckout";
  /** Shared with the browser pixel so the two are deduplicated, not double-counted. */
  eventId: string;
  eventSourceUrl?: string;
  email?: string | null;
  phone?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  value?: number;
  currency?: string;
};

export async function sendConversionEvent(event: CapiEvent) {
  const config = await getServerTrackingConfig();
  const token = config?.metaCapiToken ?? process.env.META_CAPI_ACCESS_TOKEN;
  const datasetId = config?.metaDatasetId ?? config?.metaPixelId ?? process.env.META_CAPI_DATASET_ID;
  if (!token || !datasetId) return;

  await enqueue("tracking.capi", { eventName: event.eventName, eventId: event.eventId }, async () => {
    const response = await fetch(`https://graph.facebook.com/v21.0/${datasetId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: token,
        data: [
          {
            event_name: event.eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: event.eventId,
            event_source_url: event.eventSourceUrl,
            action_source: "website",
            user_data: {
              em: hash(event.email) ? [hash(event.email)] : undefined,
              ph: hash(event.phone) ? [hash(event.phone)] : undefined,
              client_ip_address: event.clientIp ?? undefined,
              client_user_agent: event.userAgent ?? undefined,
            },
            ...(event.value
              ? { custom_data: { value: event.value, currency: event.currency ?? "BDT" } }
              : {}),
          },
        ],
      }),
    });
    if (!response.ok) {
      console.error("[tracking] Meta CAPI responded", response.status, await response.text());
    }
  });
}

export function newEventId() {
  return crypto.randomUUID();
}
