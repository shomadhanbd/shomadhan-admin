"use client";

import { Trash2 } from "lucide-react";
import { JSON_METADATA_TYPES, QUESTION_TYPES } from "@/features/question-bank/constants";
import { blankQuestion, type QuestionDraft } from "@/features/question-bank/question-draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LookupSelect } from "@/components/shared/lookup-select";
import { Field } from "@/components/shared/page-shell";
import { ContentField } from "@/components/shared/rich-content";
import { McqOptionsEditor } from "./mcq-options-editor";
import type { QuestionType } from "@/features/question-bank/types";

/** One question of a block: its type, text, options (MCQ), answer and explanation. */
export function QuestionEditor({
  question,
  grouped,
  onChange,
  onRemove,
}: {
  question: QuestionDraft;
  /** Inside a stimulus group, where a question has a part label and can be removed. */
  grouped: boolean;
  onChange: (patch: Partial<QuestionDraft>) => void;
  onRemove?: () => void;
}) {
  const id = question.key;
  const isMcq = question.question_type === "mcq";

  function changeType(type: string) {
    const next = type as QuestionType;
    // Options belong to the old type; an MCQ starts with empty ones, anything else with none.
    onChange({ question_type: next, options: blankQuestion(next).options, selectMode: "single", metadataText: "{}" });
  }

  return (
    <div className="space-y-4 rounded-(--shape-md) border border-border bg-card p-4">
      <div className="flex items-end gap-3">
        <Field id={`${id}-type`} label="Type" className="min-w-0 flex-1">
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
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove question ${question.label}`}
            onClick={onRemove}
            className="mb-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ContentField
        id={`${id}-prompt`}
        label="Question"
        required
        value={question.prompt_content}
        onChange={(v) => onChange({ prompt_content: v })}
        placeholder="HTML and LaTeX, e.g. <p>Find $x$ when $x^2 = 4$.</p>"
      />

      {isMcq && <McqOptionsEditor id={id} question={question} onChange={onChange} />}

      {!isMcq && (
        <ContentField
          id={`${id}-answer`}
          label="Model answer"
          value={question.model_answer}
          onChange={(v) => onChange({ model_answer: v })}
        />
      )}

      <ContentField
        id={`${id}-explanation`}
        label="Explanation"
        rows={2}
        value={question.explanation}
        onChange={(v) => onChange({ explanation: v })}
      />

      {JSON_METADATA_TYPES.includes(question.question_type) && (
        <Field
          id={`${id}-metadata`}
          label="Metadata (JSON)"
          hint="The structured answer key for this type, e.g. a fill-in-the-blank's blanks. Leave {} if there is none."
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
  );
}
