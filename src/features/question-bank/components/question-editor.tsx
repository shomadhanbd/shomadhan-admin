"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Trash2 } from "lucide-react";
import { plainText } from "@/lib/format";
import { cn } from "@/lib/utils";
import { JSON_METADATA_TYPES, QUESTION_TYPES, QUESTION_TYPE_LABELS } from "@/features/question-bank/constants";
import { blankQuestion, type QuestionDraft } from "@/features/question-bank/question-draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LookupSelect } from "@/components/shared/lookup-select";
import { Field } from "@/components/shared/page-shell";
import { ContentField } from "@/components/shared/rich-content";
import { McqOptionsEditor } from "./mcq-options-editor";
import type { QuestionType } from "@/features/question-bank/types";

/**
 * One question of a block, in a card that folds to a one-line summary: type, label and marks on the header row,
 * then its text, options (MCQ), answer and explanation.
 */
export function QuestionEditor({
  question,
  grouped,
  onChange,
  onRemove,
  onMove,
  previewClassName,
}: {
  question: QuestionDraft;
  /** Inside a stimulus group, where a question has a part label, can be reordered and can be removed. */
  grouped: boolean;
  onChange: (patch: Partial<QuestionDraft>) => void;
  onRemove?: () => void;
  /** Moves this question up (-1) or down (1); a direction is absent at that end of the list. */
  onMove?: { up?: () => void; down?: () => void };
  /** Passed to each content field's own preview, so the page can hide them where it shows a full preview. */
  previewClassName?: string;
}) {
  const [open, setOpen] = useState(true);
  const id = question.key;
  const isMcq = question.question_type === "mcq";
  const name = grouped ? `Question ${question.label || ""}`.trim() : "Question";
  const summary = plainText(question.prompt_content);

  function changeType(type: string) {
    const next = type as QuestionType;
    // Options belong to the old type; an MCQ starts with empty ones, anything else with none.
    onChange({ question_type: next, options: blankQuestion(next).options, selectMode: "single", metadataText: "{}" });
  }

  return (
    <div className="overflow-hidden rounded-(--shape-md) border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-surface-1 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-short)",
              !open && "-rotate-90",
            )}
          />
          <span className="shrink-0 text-sm font-semibold text-foreground">{name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {QUESTION_TYPE_LABELS[question.question_type]} · {Number(question.marks) || 0}{" "}
            {Number(question.marks) === 1 ? "mark" : "marks"}
          </span>
          {/* Folded, the card still says which question it is. */}
          {!open && <span className="min-w-0 truncate text-xs text-muted-foreground">{summary || "No text yet"}</span>}
        </button>
        {onMove && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move ${name} up`}
              disabled={!onMove.up}
              onClick={onMove.up}
              className="h-7 w-7 text-muted-foreground"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move ${name} down`}
              disabled={!onMove.down}
              onClick={onMove.down}
              className="h-7 w-7 text-muted-foreground"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove ${name}`}
            onClick={onRemove}
            className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {open && (
        <div className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
            <Field id={`${id}-type`} label="Type">
              <LookupSelect
                id={`${id}-type`}
                value={question.question_type}
                onChange={changeType}
                options={QUESTION_TYPES}
                placeholder="Pick a type"
                className="w-full"
              />
            </Field>
            {grouped && (
              <Field id={`${id}-label`} label="Label">
                <Input
                  id={`${id}-label`}
                  value={question.label}
                  onChange={(e) => onChange({ label: e.target.value })}
                  placeholder="e.g. a"
                  maxLength={8}
                  className="w-20"
                />
              </Field>
            )}
            <Field id={`${id}-marks`} label="Marks">
              <Input
                id={`${id}-marks`}
                type="number"
                min={0}
                step="0.25"
                value={question.marks}
                onChange={(e) => onChange({ marks: e.target.value })}
                className="w-20"
              />
            </Field>
          </div>

          <ContentField
            id={`${id}-prompt`}
            label="Question"
            required
            value={question.prompt_content}
            onChange={(v) => onChange({ prompt_content: v })}
            placeholder="e.g. <p>Find $x$ when $x^2 = 4$.</p>"
            previewClassName={previewClassName}
          />

          {isMcq && <McqOptionsEditor id={id} question={question} onChange={onChange} />}

          {!isMcq && (
            <ContentField
              id={`${id}-answer`}
              label="Model answer"
              value={question.model_answer}
              onChange={(v) => onChange({ model_answer: v })}
              previewClassName={previewClassName}
            />
          )}

          <ContentField
            id={`${id}-explanation`}
            label="Explanation"
            hint="Shown to students after they answer."
            rows={2}
            value={question.explanation}
            onChange={(v) => onChange({ explanation: v })}
            previewClassName={previewClassName}
          />

          {JSON_METADATA_TYPES.includes(question.question_type) && (
            <Field
              id={`${id}-metadata`}
              label="Answer key (JSON)"
              hint="The structured answer for this type, e.g. a fill-in-the-blank's blanks. Leave {} if there is none."
            >
              <Textarea
                id={`${id}-metadata`}
                value={question.metadataText}
                onChange={(e) => onChange({ metadataText: e.target.value })}
                rows={4}
                className="font-mono text-xs"
              />
            </Field>
          )}
        </div>
      )}
    </div>
  );
}
