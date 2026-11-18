"use client";

import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { emptyOption, type QuestionDraft } from "@/features/question-bank/question-draft";

/** Letters shown beside the options, in the order students see them. */
const LETTERS = "abcdefghij";

/** An MCQ's options, which of them are correct, and whether more than one may be. */
export function McqOptionsEditor({
  id,
  question,
  onChange,
}: {
  id: string;
  question: QuestionDraft;
  onChange: (patch: Partial<QuestionDraft>) => void;
}) {
  const { options, selectMode } = question;

  function markCorrect(index: number) {
    onChange({
      options: options.map((o, i) =>
        // Single answer: choosing one clears the rest. Multiple: each one toggles on its own.
        selectMode === "single"
          ? { ...o, is_correct: i === index }
          : i === index
            ? { ...o, is_correct: !o.is_correct }
            : o,
      ),
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          Options
          <span aria-hidden className="ml-0.5 text-destructive">
            *
          </span>
        </p>
        <label htmlFor={`${id}-multiple`} className="flex items-center gap-2 text-xs text-muted-foreground">
          <Switch
            id={`${id}-multiple`}
            checked={selectMode === "multiple"}
            onCheckedChange={(multiple: boolean) => {
              const firstCorrect = options.findIndex((o) => o.is_correct);
              onChange({
                selectMode: multiple ? "multiple" : "single",
                // Back to single: keep only the first correct option.
                options: multiple ? options : options.map((o, i) => ({ ...o, is_correct: i === firstCorrect })),
              });
            }}
          />
          More than one correct answer
        </label>
      </div>

      <ol className="space-y-2">
        {options.map((option, oi) => {
          const correct = Boolean(option.is_correct);
          return (
            <li key={oi} className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-center text-xs font-medium text-muted-foreground">{LETTERS[oi]}</span>
              <Input
                aria-label={`Option ${LETTERS[oi]}`}
                value={option.content}
                onChange={(e) =>
                  onChange({ options: options.map((o, i) => (i === oi ? { ...o, content: e.target.value } : o)) })
                }
                placeholder={`Option ${LETTERS[oi]}`}
                className={cn(correct && "border-success/50 bg-success/5")}
              />
              {/* A labelled button, not a bare switch: which option is right should read at a glance. */}
              <button
                type="button"
                aria-pressed={correct}
                aria-label={`Option ${LETTERS[oi]} is correct`}
                onClick={() => markCorrect(oi)}
                className={cn(
                  "flex h-8 shrink-0 items-center gap-1.5 rounded-(--shape-sm) border px-2.5 text-xs font-medium transition-colors duration-(--duration-short)",
                  correct
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                )}
              >
                <Check className="h-3.5 w-3.5" />
                Correct
              </button>
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove option ${LETTERS[oi]}`}
                  onClick={() => onChange({ options: options.filter((_, i) => i !== oi) })}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </li>
          );
        })}
      </ol>

      {options.length < LETTERS.length && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ options: [...options, emptyOption()] })}
        >
          <Plus className="h-3.5 w-3.5" />
          Add option
        </Button>
      )}
    </div>
  );
}
