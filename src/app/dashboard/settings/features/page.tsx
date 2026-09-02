import { Panel } from "@/components/dashboard/page-shell";
import { FeatureFlagToggle } from "@/components/dashboard/settings-forms";
import { prisma } from "@/lib/db";
import { defaultFeatureFlags } from "@/content/site";

export const dynamic = "force-dynamic";

export default async function FeatureFlagsPage() {
  const stored = await prisma.featureFlag.findMany({ orderBy: { key: "asc" } }).catch(() => []);
  const flags = stored.length ? stored : defaultFeatureFlags.map((flag) => ({ ...flag, updatedAt: new Date() }));

  return (
    <Panel title="Feature flags" description="Turn optional front-end features on or off without a deployment.">
      <ul className="divide-y divide-border">
        {flags.map((flag) => (
          <li key={flag.key} className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{flag.key.replace(/_/g, " ")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{flag.description}</p>
            </div>
            <FeatureFlagToggle flagKey={flag.key} enabled={flag.enabled} description={flag.description} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
