import type { MockTestStatus } from "./types";

export const MOCK_TEST_STATUSES: { id: MockTestStatus; name: string }[] = [
  { id: "draft", name: "Draft" },
  { id: "upcoming", name: "Upcoming" },
  { id: "running", name: "Running" },
  { id: "ended", name: "Ended" },
  { id: "published", name: "Results out" },
];

export const MOCK_TEST_STATUS_LABELS = Object.fromEntries(MOCK_TEST_STATUSES.map((s) => [s.id, s.name])) as Record<
  MockTestStatus,
  string
>;
