"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, X } from "lucide-react";
import { plainText } from "@/lib/format";
import { cn } from "@/lib/utils";
import { blockMarks, marksLabel } from "@/features/mock-tests/mock-test-draft";
import { BlockPreview } from "@/features/question-bank/components/block-preview";
import { QUESTION_TYPE_LABELS } from "@/features/question-bank/constants";
import { Button } from "@/components/ui/button";
import { RichContent } from "@/components/shared/rich-content";
import type { QuestionBlock } from "@/features/question-bank/types";

/** The test's paper: its blocks in order, each one expandable to its full content, movable and removable. */
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
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

  function move(index: number, by: -1 | 1) {
    const next = [...blocks];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    onChange(next);
  }

  function toggle(id: number) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (blocks.length === 0) {
    return (
      <p className="rounded-(--shape-md) border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No questions yet. A test needs at least one before it can be published.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-border rounded-(--shape-md) border border-border">
      {blocks.map((block, index) => {
        const open = expanded.has(block.id);
        return (
          <li key={block.id}>
            <div className="flex items-center gap-2 px-2 py-2">
              <button
                type="button"
                onClick={() => toggle(block.id)}
                aria-expanded={open}
                aria-label={`${open ? "Hide" : "Show"} question ${index + 1}`}
                className="flex min-w-0 flex-1 items-start gap-2 rounded-(--shape-sm) px-1 py-0.5 text-left transition-colors duration-(--duration-short) hover:bg-primary/(--state-hover)"
              >
                <span className="mt-0.5 w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <RichContent
                    content={plainText(block.stimulus_content) || plainText(block.questions[0]?.prompt_content)}
                    className={cn(open ? "" : "line-clamp-1")}
                  />
                  <span className="block truncate text-xs text-muted-foreground">
                    {[...new Set(block.questions.map((q) => QUESTION_TYPE_LABELS[q.question_type]))].join(", ")} ·{" "}
                    {block.subject_name} · {marksLabel(blockMarks(block))}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-short)",
                    !open && "-rotate-90",
                  )}
                />
              </button>
              {!locked && (
                <div className="flex shrink-0 items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move question ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="h-7 w-7 text-muted-foreground"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move question ${index + 1} down`}
                    disabled={index === blocks.length - 1}
                    onClick={() => move(index, 1)}
                    className="h-7 w-7 text-muted-foreground"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove question ${index + 1} from the paper`}
                    onClick={() => onChange(blocks.filter((b) => b.id !== block.id))}
                    className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            {open && (
              <div className="border-t border-border bg-surface-1 px-4 py-3">
                <BlockPreview block={block} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
