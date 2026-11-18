import type { QuestionType } from "@/features/question-bank/types";

export type ReportStatus = "open" | "reviewed" | "dismissed";

export type ReportReason = "question" | "answer" | "explanation" | "illogical";

/** A student's report against one question. Only `status` can be changed. */
export interface Report {
  id: number;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  user: number;
  user_mobile: string | null;
  user_name: string;
  question: number;
  question_slug: string;
  question_type: QuestionType;
  question_prompt: string;
  /** The block that holds the question, for opening it in the question editor. */
  block: number;
  /** The block's reference (`b-17`), as the question bank shows it. */
  block_slug: string;
  created_at: string;
}
