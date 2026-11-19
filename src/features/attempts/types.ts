export type AttemptStatus = "in_progress" | "submitted" | "expired" | "graded";

/** One student's sitting of a mock test, as `/admin/attempts/` lists it. */
export interface Attempt {
  id: number;
  user: number;
  user_name: string;
  user_mobile: string;
  mock_test: number;
  mock_test_title: string;
  status: AttemptStatus;
  total_score: string;
  /** The test's total, as students' results are read against it. */
  total_marks: string;
  correct_count: number;
  /** Answers given and not right, written ones marked below full marks included. */
  wrong_count: number;
  unanswered_count: number;
  /** Answers left to mark by hand (CQ and other written ones). */
  ungraded_count: number;
  started_at: string;
  expires_at: string;
  submitted_at: string | null;
}

/** One answer as stored; its shape follows the question's type. */
export interface AttemptAnswer {
  question: number;
  /** MCQ `{selected_option_ids}`, FIB `{blanks}`, ordering `{ordered_option_ids}`, others `{text}`. */
  payload: Record<string, unknown>;
  /** `null` while it waits to be marked by hand. */
  is_correct: boolean | null;
  awarded_marks: string;
}

export interface AttemptDetail extends Attempt {
  answers: AttemptAnswer[];
}

/** `/admin/attempts/summary/?mock_test=`: scores are of fully graded papers only. */
export interface AttemptSummary {
  finished: number;
  /** Finished papers with written answers still waiting for marks. */
  to_mark: number;
  in_progress: number;
  average_score: number | null;
  highest_score: number | null;
  lowest_score: number | null;
}
