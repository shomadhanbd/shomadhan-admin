"use client";

import { Check } from "lucide-react";
import { JSON_METADATA_TYPES, QUESTION_TYPE_LABELS } from "@/features/question-bank/constants";
import { RichContent } from "@/components/shared/rich-content";
import type { BankQuestion } from "@/features/question-bank/types";

/** What the preview needs of one question; ids are strings for a draft that has not been saved yet. */
type PreviewQuestion = Omit<BankQuestion, "id" | "slug" | "order_in_set" | "options"> & {
  id: number | string;
  options: { id: number | string; content: string; is_correct: boolean | null }[];
};

/** What the preview needs of a block: a saved QuestionBlock, or `toPreview` of an editor draft. */
export interface PreviewBlock {
  stimulus_content: string;
  questions: PreviewQuestion[];
}

/** One block as a student reads it, plus the answer key: the stimulus, each question, and the correct options. */
export function BlockPreview({ block, number }: { block: PreviewBlock; number?: number }) {
  return (
    <div className="space-y-3">
      {block.stimulus_content && (
        <RichContent content={block.stimulus_content} className="rounded-(--shape-sm) bg-surface-2 px-3 py-2" />
      )}
      {block.questions.map((question, index) => (
        <div key={question.id} className="flex gap-3">
          <span className="w-6 shrink-0 text-right text-sm font-medium text-muted-foreground tabular-nums">
            {/* A group's parts carry their own labels; a standalone question takes the paper's number. */}
            {question.label || (index === 0 && number !== undefined ? `${number}.` : "")}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <RichContent content={question.prompt_content} />
            {question.options.length > 0 && (
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {question.options.map((option) => (
                  <li
                    key={option.id}
                    className={`flex items-start gap-2 rounded-(--shape-sm) border px-2.5 py-1.5 ${
                      option.is_correct ? "border-success/40 bg-success/10" : "border-border"
                    }`}
                  >
                    <RichContent content={option.content} className="min-w-0 flex-1" />
                    {option.is_correct && (
                      <Check aria-label="Correct answer" className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    )}
                  </li>
                ))}
              </ul>
            )}
            {question.model_answer && (
              <div className="border-l-2 border-border pl-3">
                <p className="text-[11px] font-medium text-muted-foreground">Model answer</p>
                <RichContent content={question.model_answer} className="text-muted-foreground" />
              </div>
            )}
            {question.explanation && (
              <div className="border-l-2 border-border pl-3">
                <p className="text-[11px] font-medium text-muted-foreground">Explanation</p>
                <RichContent content={question.explanation} className="text-muted-foreground" />
              </div>
            )}
            {JSON_METADATA_TYPES.includes(question.question_type) && Object.keys(question.metadata).length > 0 && (
              <div className="border-l-2 border-border pl-3">
                <p className="text-[11px] font-medium text-muted-foreground">Answer key</p>
                <pre className="overflow-x-auto font-mono text-xs whitespace-pre-wrap text-muted-foreground">
                  {JSON.stringify(question.metadata, null, 2)}
                </pre>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {QUESTION_TYPE_LABELS[question.question_type]} · {Number(question.marks)}{" "}
              {Number(question.marks) === 1 ? "mark" : "marks"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
