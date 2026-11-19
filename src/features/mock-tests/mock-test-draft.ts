import { fromLocalInput, toLocalInput } from "@/lib/format";
import type { QuestionBlock } from "@/features/question-bank/types";
import type { MockTestBody, MockTestDetail } from "./types";

/** The mock test editor's form state. Times are `datetime-local` strings; numbers are text until saved. */
export interface MockTestDraft {
  title: string;
  subtitle: string;
  description: string;
  levels: number[];
  groups: number[];
  subjects: number[];
  /** The paper, in test order. Whole blocks, so the editor can show what each one is. */
  blocks: QuestionBlock[];
  timeLimit: string;
  maxAttempts: string;
  hasNegativeMarking: boolean;
  negativeFraction: string;
  start: string;
  end: string;
  resultPublish: string;
  isPublished: boolean;
}

export const blankMockTest = (): MockTestDraft => ({
  title: "",
  subtitle: "",
  description: "",
  levels: [],
  groups: [],
  subjects: [],
  blocks: [],
  timeLimit: "30",
  maxAttempts: "1",
  hasNegativeMarking: false,
  negativeFraction: "0.25",
  start: "",
  end: "",
  resultPublish: "",
  isPublished: false,
});

export function toDraft(test: MockTestDetail): MockTestDraft {
  return {
    title: test.title,
    subtitle: test.subtitle,
    description: test.description,
    levels: test.applied_education_levels,
    groups: test.applied_academic_groups,
    subjects: test.applied_subjects,
    blocks: test.blocks,
    timeLimit: String(test.time_limit_minutes),
    maxAttempts: String(test.max_attempts),
    hasNegativeMarking: test.has_negative_marking,
    negativeFraction: test.negative_marks_fraction,
    start: toLocalInput(test.start_time),
    end: toLocalInput(test.end_time),
    resultPublish: toLocalInput(test.result_publish_time),
    isPublished: test.is_published,
  };
}

/** The marks a block is worth: the sum over its questions. */
export const blockMarks = (block: QuestionBlock): number =>
  block.questions.reduce((sum, q) => sum + Number(q.marks), 0);

/** `1 mark`, `4 marks`. */
export const marksLabel = (marks: number): string => `${marks} ${marks === 1 ? "mark" : "marks"}`;

/** Why the draft cannot be saved yet, in words for the editor's footer; `null` when it can. */
export function draftProblem(draft: MockTestDraft): string | null {
  if (!draft.title.trim()) return "Give the test a title";
  if (!draft.levels.length) return "Pick an education level";
  if (!draft.groups.length) return "Pick an academic group";
  if (!draft.subjects.length) return "Pick a subject";
  if (!draft.start || !draft.end || !draft.resultPublish) return "Set the start, end and result times";
  if (draft.end < draft.start) return "The test cannot end before it starts";
  if (draft.resultPublish < draft.end) return "Results cannot be published before the test ends";
  if (!(Number(draft.timeLimit) > 0)) return "Set a time limit";
  if (!(Number(draft.maxAttempts) > 0)) return "Allow at least one attempt";
  const fraction = Number(draft.negativeFraction);
  if (draft.hasNegativeMarking && !(fraction > 0 && fraction <= 1)) return "Negative marking must be between 0 and 1";
  const stray = draft.blocks.filter((b) => !draft.subjects.includes(b.subject)).length;
  if (stray) return `${stray} ${stray === 1 ? "question is" : "questions are"} from a subject the test no longer has`;
  if (draft.isPublished && !draft.blocks.length) return "Add questions before publishing";
  return null;
}

/** The request body; `original` is the saved test being edited, so untouched times go back exactly. */
export function toBody(draft: MockTestDraft, original?: MockTestDetail | null): MockTestBody {
  return {
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim(),
    description: draft.description.trim(),
    applied_education_levels: draft.levels,
    applied_academic_groups: draft.groups,
    applied_subjects: draft.subjects,
    block_ids: draft.blocks.map((b) => b.id),
    time_limit_minutes: Number(draft.timeLimit),
    has_negative_marking: draft.hasNegativeMarking,
    negative_marks_fraction: draft.hasNegativeMarking ? draft.negativeFraction : "0",
    max_attempts: Number(draft.maxAttempts),
    // `datetime-local` is the admin's own clock; the API takes an absolute moment. All three are required.
    start_time: fromLocalInput(draft.start, original?.start_time)!,
    end_time: fromLocalInput(draft.end, original?.end_time)!,
    result_publish_time: fromLocalInput(draft.resultPublish, original?.result_publish_time)!,
    is_published: draft.isPublished,
  };
}
