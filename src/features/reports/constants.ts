import type { ReportReason, ReportStatus } from "./types";

export const REPORT_STATUSES: { id: ReportStatus; name: string }[] = [
  { id: "open", name: "Open" },
  { id: "reviewed", name: "Reviewed" },
  { id: "dismissed", name: "Dismissed" },
];

/** What the student said is wrong; the app offers exactly these four. */
export const REPORT_REASONS: { id: ReportReason; name: string }[] = [
  { id: "question", name: "Question" },
  { id: "answer", name: "Answer" },
  { id: "explanation", name: "Explanation" },
  { id: "illogical", name: "Illogical" },
];

export const REPORT_REASON_LABELS = Object.fromEntries(REPORT_REASONS.map((r) => [r.id, r.name])) as Record<
  ReportReason,
  string
>;
