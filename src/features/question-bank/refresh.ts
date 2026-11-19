import type { QueryClient } from "@tanstack/react-query";
import { curriculumKeys } from "@/features/curriculum/api";
import { mockTestKeys } from "@/features/mock-tests/api";
import { questionBlockKeys } from "@/features/question-bank/api";

/**
 * Everything a question's save or delete shows up in: the bank itself, the question counts on the
 * curriculum screens, and mock tests, whose papers carry their questions' text and marks.
 */
export function refreshAfterQuestionChange(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: questionBlockKeys.all });
  queryClient.invalidateQueries({ queryKey: mockTestKeys.all });
  for (const key of ["chapters", "subjects", "academicGroups", "educationLevels"] as const) {
    queryClient.invalidateQueries({ queryKey: curriculumKeys[key].all });
  }
}
