"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";

import { ActionForm, ConfirmButton, SubmitButton } from "@/components/dashboard/action-form";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  deleteNavigationItemAction,
  moveNavigationItemAction,
  saveNavigationItemAction,
} from "@/actions/navigation";

export const NAV_LOCATIONS = [
  { value: "HEADER", label: "Main navigation" },
  { value: "FOOTER_SERVICES", label: "Footer — Services" },
  { value: "FOOTER_COMPANY", label: "Footer — Company" },
  { value: "FOOTER_LEGAL", label: "Footer — Legal" },
] as const;

export type NavItem = {
  id: string;
  location: string;
  label: string;
  href: string;
  position: number;
  enabled: boolean;
};

/**
 * One row of the navigation editor.
 *
 * Each link is its own form so saving one cannot disturb another, and the
 * changes land on the live site immediately — the marketing layout reads the
 * same rows.
 */
function NavRow({ item }: { item: NavItem }) {
  const { toast } = useToast();

  return (
    <div className="rounded-lg border border-line p-3">
      <ActionForm action={saveNavigationItemAction} successTitle="Link saved" className="space-y-3">
        <input type="hidden" name="id" value={item.id} />
        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_5rem]">
          <Field label="Label" htmlFor={`nav-label-${item.id}`}>
            <Input id={`nav-label-${item.id}`} name="label" defaultValue={item.label} required />
          </Field>
          <Field label="Link" htmlFor={`nav-href-${item.id}`}>
            <Input id={`nav-href-${item.id}`} name="href" defaultValue={item.href} required />
          </Field>
          <Field label="Order" htmlFor={`nav-pos-${item.id}`}>
            <Input
              id={`nav-pos-${item.id}`}
              name="position"
              type="number"
              defaultValue={String(item.position)}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="Menu" htmlFor={`nav-loc-${item.id}`}>
            <Select id={`nav-loc-${item.id}`} name="location" defaultValue={item.location}>
              {NAV_LOCATIONS.map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-end gap-2.5 pb-3 text-step--1">
            <Checkbox name="enabled" defaultChecked={item.enabled} />
            Visible
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SubmitButton>Save link</SubmitButton>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Move ${item.label} up`}
            onClick={async () => {
              await moveNavigationItemAction(item.id, "up");
              toast({ kind: "success", title: "Moved up" });
            }}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Move ${item.label} down`}
            onClick={async () => {
              await moveNavigationItemAction(item.id, "down");
              toast({ kind: "success", title: "Moved down" });
            }}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <ConfirmButton
            label="Remove"
            confirmLabel="Remove it?"
            onConfirm={async () => {
              await deleteNavigationItemAction(item.id);
              toast({ kind: "success", title: "Link removed" });
            }}
          />
        </div>
      </ActionForm>
    </div>
  );
}

export function NavigationEditor({ items }: { items: NavItem[] }) {
  const [adding, setAdding] = React.useState(false);

  const grouped = NAV_LOCATIONS.map((location) => ({
    ...location,
    links: items
      .filter((item) => item.location === location.value)
      .sort((a, b) => a.position - b.position),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-step--2 text-ink-muted">
          These are the real header and footer links. Anything you change here is live on the site
          straight away.
        </p>
        <Button size="sm" variant="outline" onClick={() => setAdding((open) => !open)}>
          <Plus className="h-4 w-4" />
          {adding ? "Close" : "Add link"}
        </Button>
      </div>

      {adding ? (
        <div className="rounded-lg border border-accent-border bg-accent-soft/40 p-4">
          <ActionForm
            action={saveNavigationItemAction}
            successTitle="Link added"
            resetOnSuccess
            className="space-y-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Label" htmlFor="nav-new-label">
                <Input id="nav-new-label" name="label" placeholder="Case studies" required />
              </Field>
              <Field label="Link" htmlFor="nav-new-href" hint="A path like /work, or a full https:// address.">
                <Input id="nav-new-href" name="href" placeholder="/work" required />
              </Field>
              <Field label="Menu" htmlFor="nav-new-location">
                <Select id="nav-new-location" name="location" defaultValue="HEADER">
                  {NAV_LOCATIONS.map((location) => (
                    <option key={location.value} value={location.value}>
                      {location.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Order" htmlFor="nav-new-position">
                <Input id="nav-new-position" name="position" type="number" defaultValue="99" />
              </Field>
            </div>
            <input type="hidden" name="enabled" value="on" />
            <SubmitButton>Add link</SubmitButton>
          </ActionForm>
        </div>
      ) : null}

      {grouped.map((group) => (
        <section key={group.value}>
          <h2 className="text-step-0 font-semibold text-ink">{group.label}</h2>
          {group.links.length ? (
            <div className="mt-3 space-y-3">
              {group.links.map((item) => (
                <NavRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-step--1 text-ink-muted">No links in this menu yet.</p>
          )}
        </section>
      ))}
    </div>
  );
}
