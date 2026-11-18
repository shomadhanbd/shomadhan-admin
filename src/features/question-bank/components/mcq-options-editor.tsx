"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RichContent } from "@/components/shared/rich-content";
import { emptyOption, type QuestionDraft } from "@/features/question-bank/question-draft";

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

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">
        Options
        <span aria-hidden className="ml-0.5 text-destructive">
          *
        </span>
      </p>
      {options.map((option, oi) => (
        <div key={oi} className="space-y-1">
          <div className="flex items-center gap-2">
            <Switch
              aria-label={`Option ${oi + 1} is correct`}
              checked={Boolean(option.is_correct)}
              onCheckedChange={(checked: boolean) =>
                onChange({
                  // Single answer: turning one on turns the rest off.
                  options: options.map((o, i) =>
                    i === oi
                      ? { ...o, is_correct: checked }
                      : selectMode === "single"
                        ? { ...o, is_correct: false }
                        : o,
                  ),
                })
              }
            />
            <Input
              aria-label={`Option ${oi + 1}`}
              value={option.content}
              onChange={(e) =>
                onChange({ options: options.map((o, i) => (i === oi ? { ...o, content: e.target.value } : o)) })
              }
              placeholder={`Option ${oi + 1}`}
            />
            {options.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remove option ${oi + 1}`}
                onClick={() => onChange({ options: options.filter((_, i) => i !== oi) })}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {/* Only worth a preview when the option holds markup or a formula. */}
          {/[<$]/.test(option.content) && <RichContent content={option.content} className="pl-11 text-xs" />}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange({ options: [...options, emptyOption()] })}
      >
        <Plus className="h-3.5 w-3.5" />
        Add option
      </Button>
      <div className="flex items-center gap-2 pt-1">
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
        <label htmlFor={`${id}-multiple`} className="text-sm text-foreground">
          More than one correct answer
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        {selectMode === "single"
          ? "Switch on the one correct option. At least two options need text."
          : "Switch on every correct option; a student must choose all of them."}
      </p>
    </div>
  );
}
