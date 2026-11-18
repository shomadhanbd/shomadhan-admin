"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { plainText } from "@/lib/format";
import { blockMarks, marksLabel } from "@/features/mock-tests/mock-test-draft";
import { QUESTION_TYPE_LABELS } from "@/features/question-bank/constants";
import { Button } from "@/components/ui/button";
import { RichContent } from "@/components/shared/rich-content";
import type { QuestionBlock } from "@/features/question-bank/types";

/** The test's paper: its blocks in order, each movable up or down, or removable. */
export function PaperEditor({
  blocks,
  locked,
  onChange,
}: {
  blocks: QuestionBlock[];
  /** Students have attempted the test, so the paper can no longer change. */
  locked: boolean;
  onChange: (blocks: QuestionBlock[]) => void;
}) {
  function move(index: number, by: -1 | 1) {
    const next = [...blocks];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    onChange(next);
  }

  if (blocks.length === 0) {
    return (
      <p className="rounded-(--shape-md) border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No questions yet. A test needs at least one before it can be published.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-border rounded-(--shape-md) border border-border bg-card">
      {blocks.map((block, index) => (
        <li key={block.id} className="flex items-center gap-3 px-3 py-2.5">
          <span className="w-6 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{index + 1}</span>
          <div className="min-w-0 flex-1">
            <RichContent
              content={plainText(block.stimulus_content) || plainText(block.questions[0]?.prompt_content)}
              className="truncate"
            />
            <p className="truncate text-xs text-muted-foreground">
              {[...new Set(block.questions.map((q) => QUESTION_TYPE_LABELS[q.question_type]))].join(", ")} ·{" "}
              {block.subject_name} · {marksLabel(blockMarks(block))}
            </p>
          </div>
          {!locked && (
            <div className="flex shrink-0 items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move question ${index + 1} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="text-muted-foreground"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move question ${index + 1} down`}
                disabled={index === blocks.length - 1}
                onClick={() => move(index, 1)}
                className="text-muted-foreground"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove question ${index + 1} from the paper`}
                onClick={() => onChange(blocks.filter((b) => b.id !== block.id))}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
