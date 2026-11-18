import type { QuestionBlock } from "@/features/question-bank/types";

/** Where a test is in its life; `draft` is unpublished, `published` means results are out. */
export type MockTestStatus = "draft" | "upcoming" | "running" | "ended" | "published";

/** A mock test as the list returns it: everything but the paper. */
export interface MockTest {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  applied_education_levels: number[];
  applied_academic_groups: number[];
  applied_subjects: number[];
  block_count: number;
  question_count: number;
  /** Once any student has started the test, its paper can no longer change. */
  has_attempts: boolean;
  time_limit_minutes: number;
  total_marks: string;
  has_negative_marking: boolean;
  negative_marks_fraction: string;
  max_attempts: number;
  start_time: string;
  end_time: string;
  result_publish_time: string;
  is_published: boolean;
  status: MockTestStatus;
}

/** One test fetched on its own, with its paper: the blocks in test order. */
export interface MockTestDetail extends MockTest {
  blocks: QuestionBlock[];
}

export interface MockTestBody {
  title: string;
  subtitle: string;
  description: string;
  applied_education_levels: number[];
  applied_academic_groups: number[];
  applied_subjects: number[];
  /** The whole paper, in order. */
  block_ids: number[];
  time_limit_minutes: number;
  has_negative_marking: boolean;
  negative_marks_fraction: string;
  max_attempts: number;
  start_time: string;
  end_time: string;
  result_publish_time: string;
  is_published: boolean;
}
