import type { Attempt } from "./types";

type Variant = "default" | "secondary" | "success" | "warning" | "outline";

export const ATTEMPT_STATUSES: { id: string; name: string }[] = [
  { id: "graded", name: "Graded" },
  { id: "submitted", name: "Needs marking" },
  { id: "in_progress", name: "In progress" },
  { id: "expired", name: "Ran out of time" },
];

/**
 * What an attempt's status means to the admin. "Submitted" is a paper with written answers still
 * to mark; an attempt still "in progress" after its time is up was abandoned.
 */
export function attemptStatus(a: Pick<Attempt, "status" | "expires_at">): {
  name: string;
  variant: Variant;
} {
  if (a.status === "graded") return { name: "Graded", variant: "success" };
  if (a.status === "submitted") return { name: "Needs marking", variant: "warning" };
  if (a.status === "in_progress" && new Date(a.expires_at) > new Date()) {
    return { name: "In progress", variant: "default" };
  }
  return { name: "Ran out of time", variant: "outline" };
}

/** Whether the paper is finished, so its score means something. */
export const isFinished = (a: Pick<Attempt, "status">) => a.status === "graded" || a.status === "submitted";

/** Whole minutes from start to submit, or `null` while not submitted. */
export function minutesTaken(a: Pick<Attempt, "started_at" | "submitted_at">): number | null {
  if (!a.submitted_at) return null;
  return Math.max(0, Math.round((Date.parse(a.submitted_at) - Date.parse(a.started_at)) / 60_000));
}

/** "12 min", "1 h 5 min": how long a student took, from start to submit. */
export function timeTaken(a: Pick<Attempt, "started_at" | "submitted_at">): string | null {
  const minutes = minutesTaken(a);
  if (minutes === null) return null;
  if (minutes === 0) return "Under 1 min";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/** "7 / 10" and the percentage, for a finished paper. */
export function score(a: Pick<Attempt, "total_score" | "total_marks">): { text: string; percent: number } {
  const got = Number(a.total_score);
  const out = Number(a.total_marks);
  return {
    text: `${+got.toFixed(2)} / ${+out.toFixed(2)}`,
    percent: out > 0 ? Math.round((got / out) * 100) : 0,
  };
}
