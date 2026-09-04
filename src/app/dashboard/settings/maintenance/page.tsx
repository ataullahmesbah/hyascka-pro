import { Panel } from "@/components/dashboard/page-shell";
import { MaintenanceForm } from "@/components/dashboard/settings-forms";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function MaintenanceSettingsPage() {
  const { maintenance } = await getSettings();
  const offline = Boolean(maintenance.isFullModeActive);

  return (
    <Panel
      title="Maintenance"
      description="Two stages: warn visitors in advance, then take the site offline only when the work actually starts."
    >
      {/*
        Live status, stated first. Staff bypass maintenance, so the person who
        just took the site offline reloads it, sees the normal homepage, and
        reasonably concludes the switch did not work.
      */}
      <div
        className={
          offline
            ? "mb-5 rounded-lg border border-danger/40 bg-danger-soft p-4"
            : "mb-5 rounded-lg border border-success/40 bg-success-soft p-4"
        }
      >
        <p className={offline ? "text-step--1 font-semibold text-danger" : "text-step--1 font-semibold text-success"}>
          {offline ? "The public site is OFFLINE for visitors." : "The public site is live."}
        </p>
        {offline ? (
          <p className="mt-1 text-step--2 text-ink-soft">
            You and every other staff account still see the site normally — that is the bypass
            working, not the switch failing. To see what a visitor sees, open the site in a private
            window, or sign out.
          </p>
        ) : null}
      </div>

      <MaintenanceForm values={maintenance as unknown as Record<string, unknown>} />
    </Panel>
  );
}
