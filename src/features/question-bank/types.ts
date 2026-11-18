export type BlockKind = "standalone" | "group";

export type QuestionType =
  "mcq" | "cq" | "fib" | "ordering" | "short_answer" | "long_answer" | "flow_chart" | "transformation";

export interface QuestionOption {
  id: number;
  label: string;
  content: string;
  /** `null` on options that are not graded choices, e.g. a word box. */
  is_correct: boolean | null;
  position: number;
}

export interface BankQuestion {
  id: number;
  slug: string;
  question_type: QuestionType;
  label: string;
  marks: string;
  order_in_set: number;
  prompt_content: string;
  model_answer: string;
  explanation: string;
  /** Type-specific; see the backend's `questions/schemas.py`. */
  metadata: Record<string, unknown>;
  options: QuestionOption[];
}

/** A block with its whole content tree; a standalone block has one question and no stimulus. */
export interface QuestionBlock {
  id: number;
  slug: string;
  kind: BlockKind;
  subject: number;
  subject_name: string;
  chapter: number | null;
  chapter_name: string | null;
  topics: number[];
  order_in_chapter: number;
  question_count: number;
  stimulus_type: string;
  stimulus_content: string;
  questions: BankQuestion[];
  updated_at: string;
}

/** An option or question without an `id` is created; one with an `id` is updated in place. */
export interface QuestionOptionBody {
  id?: number;
  label: string;
  content: string;
  is_correct: boolean | null;
}

export interface QuestionBody {
  id?: number;
  question_type: QuestionType;
  label: string;
  marks: string;
  prompt_content: string;
  model_answer: string;
  explanation: string;
  metadata: Record<string, unknown>;
  options: QuestionOptionBody[];
}

export interface QuestionBlockBody {
  kind: BlockKind;
  subject: number;
  chapter: number | null;
  topics: number[];
  stimulus_type?: string;
  stimulus_content?: string;
  questions: QuestionBody[];
}
