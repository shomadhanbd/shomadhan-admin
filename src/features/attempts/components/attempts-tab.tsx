"use client";

import { useQuery } from "@tanstack/react-query";
import { attemptKeys, attemptsApi } from "@/features/attempts/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AttemptsTable } from "./attempts-table";

/** "7.5": marks read best without trailing zeros. */
const marks = (value: number | null) => (value === null ? "–" : String(+value.toFixed(2)));

/** The summary query, shared by the tab's label and its figures. */
export function useAttemptSummary(mockTest: number) {
  return useQuery({
    queryKey: [...attemptKeys.all, "summary", mockTest],
    queryFn: () => attemptsApi.summary(mockTest),
  });
}

/** A mock test's Attempts tab: how the test went, then every student's attempt. */
export function AttemptsTab({ mockTest, totalMarks }: { mockTest: number; totalMarks: number }) {
  const s = useAttemptSummary(mockTest).data;

  const figures: [string, string][] = s
    ? [
        ["Finished", s.finished.toLocaleString()],
        ["Needs marking", s.to_mark.toLocaleString()],
        ["Writing now", s.in_progress.toLocaleString()],
        ["Average", `${marks(s.average_score)} / ${marks(totalMarks)}`],
        ["Highest", marks(s.highest_score)],
        ["Lowest", marks(s.lowest_score)],
      ]
    : [];

  return (
    <div className="space-y-4">
      {!s ? (
        <Skeleton className="h-[74px] rounded-(--shape-md)" />
      ) : (
        // The 1px gaps over a border-coloured backing draw the lines between the figures.
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-(--shape-md) border border-border bg-border shadow-(--shadow-card) sm:grid-cols-3 lg:grid-cols-6">
          {figures.map(([label, value]) => (
            <div
              key={label}
              className={cn("bg-card px-4 py-3", label === "Needs marking" && s.to_mark > 0 && "bg-warning-surface")}
            >
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-lg font-semibold text-foreground tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <AttemptsTable mockTest={mockTest} />
    </div>
  );
}
