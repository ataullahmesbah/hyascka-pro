import "server-only";

/**
 * Background job dispatch (PRD §40.4). A slow email or Telegram provider must
 * never block a database write, so callers persist first and enqueue after.
 *
 * With QSTASH_TOKEN set, work is handed to Upstash QStash and retried by it.
 * Without it, the job runs after the response is flushed — correct for local
 * development and small deployments, and never in the critical path.
 */
export type JobName =
  | "notification.deliver"
  | "lead.notify"
  | "invoice.reminder"
  | "report.generate"
  | "tracking.capi";

export async function enqueue(name: JobName, payload: Record<string, unknown>, run: () => Promise<void>) {
  const token = process.env.QSTASH_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (process.env.JOBS_PROVIDER === "qstash" && token && siteUrl) {
    try {
      await fetch(`https://qstash.upstash.io/v2/publish/${siteUrl}/api/jobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Upstash-Retries": "3",
        },
        body: JSON.stringify({ name, payload }),
      });
      return;
    } catch (error) {
      console.error("[jobs] QStash publish failed, running inline:", error);
    }
  }

  // Deliberately not awaited: the caller has already committed its write.
  void run().catch((error) => console.error(`[jobs] ${name} failed:`, error));
}
