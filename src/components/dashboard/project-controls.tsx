"use client";

import * as React from "react";

import { updateProjectStatusAction, updateTaskStatusAction } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

const STATUSES = ["PLANNING", "IN_PROGRESS", "REVIEW", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;

export function ProjectControls({
  projectId,
  status,
  progress,
}: {
  projectId: string;
  status: string;
  progress: number;
}) {
  const [nextStatus, setNextStatus] = React.useState(status);
  const [nextProgress, setNextProgress] = React.useState(progress);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field label="Status" htmlFor="project-status">
        <Select
          id="project-status"
          value={nextStatus}
          onChange={(event) => setNextStatus(event.target.value)}
        >
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={`Progress — ${nextProgress}%`} htmlFor="project-progress">
        <input
          id="project-progress"
          type="range"
          min={0}
          max={100}
          step={5}
          value={nextProgress}
          onChange={(event) => setNextProgress(Number(event.target.value))}
          className="h-11 w-full accent-[hsl(var(--primary))]"
        />
      </Field>

      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await updateProjectStatusAction(
              projectId,
              nextStatus as (typeof STATUSES)[number],
              nextProgress,
            );
            toast({
              kind: result.ok ? "success" : "error",
              title: result.ok ? "Project updated" : "Could not update",
              description: result.message ?? "",
            });
          })
        }
      >
        Save
      </Button>
    </div>
  );
}

export function TaskList({
  tasks,
  editable,
}: {
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignee: string | null;
    dueDate: string | null;
  }[];
  editable: boolean;
}) {
  const [pending, startTransition] = React.useTransition();

  if (!tasks.length) return <p className="text-sm text-muted-foreground">No tasks yet.</p>;

  return (
    <ul className="divide-y divide-border">
      {tasks.map((task) => (
        <li key={task.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{task.title}</p>
            <p className="text-xs text-muted-foreground">
              {task.assignee ?? "Unassigned"}
              {task.dueDate ? ` · due ${formatDate(task.dueDate)}` : ""}
            </p>
          </div>
          <StatusBadge status={task.priority} />
          {editable ? (
            <select
              aria-label={`Status for ${task.title}`}
              defaultValue={task.status}
              disabled={pending}
              onChange={(event) =>
                startTransition(async () => {
                  await updateTaskStatusAction(
                    task.id,
                    event.target.value as (typeof TASK_STATUSES)[number],
                  );
                })
              }
              className="h-9 rounded-md border border-input bg-surface px-2.5 text-xs outline-none focus:border-primary"
            >
              {TASK_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          ) : (
            <StatusBadge status={task.status} />
          )}
        </li>
      ))}
    </ul>
  );
}
