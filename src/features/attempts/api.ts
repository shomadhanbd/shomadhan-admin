import api from "@/lib/api";
import type { AttemptDetail, AttemptSummary } from "./types";

/** Question types the app marks itself; any other answer is marked by hand. */
export const AUTO_MARKED = ["mcq", "fib", "ordering"];

/** `/admin/attempts/`: students' sittings of mock tests; read-only. */
export const ATTEMPTS = "/admin/attempts/";

export const attemptKeys = {
  all: ["attempts"] as const,
};

export const attemptsApi = {
  get: async (id: number) => (await api.get<AttemptDetail>(`${ATTEMPTS}${id}/`)).data,
  /** Marks for one written answer; resolves to the re-totalled attempt. */
  mark: async (id: number, question: number, awardedMarks: string) =>
    (await api.post<AttemptDetail>(`${ATTEMPTS}${id}/mark/`, { question, awarded_marks: awardedMarks })).data,
  summary: async (mockTest: number) =>
    (await api.get<AttemptSummary>(`${ATTEMPTS}summary/`, { params: { mock_test: mockTest } })).data,
};
