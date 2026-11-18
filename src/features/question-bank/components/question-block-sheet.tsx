"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/api-error";
import { useSubjects } from "@/lib/lookups";
import { chaptersApi, curriculumKeys, topicsApi } from "@/features/curriculum/api";
import { questionBlockKeys, questionBlocksApi } from "@/features/question-bank/api";
import { PART_LABELS, STIMULUS_TYPES } from "@/features/question-bank/constants";
import {
  blankBlock,
  blankQuestion,
  draftProblem,
  toBody,
  toDraft,
  type BlockDraft,
  type QuestionDraft,
} from "@/features/question-bank/question-draft";
import { Button } from "@/components/ui/button";
import { ChipSelect } from "@/components/shared/chip-select";
import { FormSection, FormSheet } from "@/components/shared/form-sheet";
import { LookupSelect } from "@/components/shared/lookup-select";
import { Field } from "@/components/shared/page-shell";
import { ContentField } from "@/components/shared/rich-content";
import { QuestionEditor } from "./question-editor";
import type { BlockKind, QuestionBlock } from "@/features/question-bank/types";

const KINDS: { id: BlockKind; title: string; blurb: string }[] = [
  { id: "standalone", title: "Single question", blurb: "One question on its own, usually an MCQ." },
  { id: "group", title: "Stimulus group", blurb: "A shared passage with questions under it, like a CQ." },
];

/** Creates or edits one block: where it sits in the curriculum, its stimulus and its questions. */
export function QuestionBlockSheet({
  block,
  defaults,
  onOpenChange,
}: {
  block: QuestionBlock | null;
  /** The list's subject and chapter filters, so a new block starts where the admin is looking. */
  defaults: { subject: string; chapter: string };
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(block);
  const subjects = useSubjects();

  const [initial] = useState<BlockDraft>(() =>
    block ? toDraft(block) : blankBlock("standalone", defaults.subject, defaults.chapter),
  );
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const patch = (changes: Partial<BlockDraft>) => setDraft((d) => ({ ...d, ...changes }));

  const chapters = useQuery({
    queryKey: [...curriculumKeys.chapters.lookup, draft.subject],
    queryFn: () => chaptersApi.bySubject(Number(draft.subject)),
    enabled: Boolean(draft.subject),
  });
  const topics = useQuery({
    queryKey: [...curriculumKeys.topics.all, "by-chapter", draft.chapter],
    queryFn: () => topicsApi.byChapter(Number(draft.chapter)),
    enabled: Boolean(draft.chapter),
  });

  const problem = draftProblem(draft);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);

  const save = useMutation({
    mutationFn: () =>
      isEdit ? questionBlocksApi.update(block!.id, toBody(draft)) : questionBlocksApi.create(toBody(draft)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionBlockKeys.all });
      // Question counts on the curriculum screens follow every save.
      for (const key of ["chapters", "subjects", "academicGroups", "educationLevels"] as const) {
        queryClient.invalidateQueries({ queryKey: curriculumKeys[key].all });
      }
      toast.success(isEdit ? "Question updated" : "Question added");
      onOpenChange(false);
    },
    onError: (err) => setError(apiError(err)),
  });

  function changeQuestion(key: string, changes: Partial<QuestionDraft>) {
    patch({ questions: draft.questions.map((q) => (q.key === key ? { ...q, ...changes } : q)) });
  }

  return (
    <FormSheet
      open
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit question" : "New question"}
      description={isEdit ? block!.slug : "Saved to the question bank and shown to students of its subject."}
      submitLabel={isEdit ? "Save changes" : "Add question"}
      pending={save.isPending}
      canSubmit={!problem}
      error={error}
      summary={problem}
      dirty={dirty}
      onSubmit={() => {
        setError(null);
        save.mutate();
      }}
    >
      {!isEdit && (
        <FormSection title="Kind" description="This cannot be changed once the question is saved.">
          <div className="grid gap-3 sm:grid-cols-2">
            {KINDS.map(({ id, title, blurb }) => {
              const active = draft.kind === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  // Switching kind swaps in that kind's starting questions; the placement is kept.
                  onClick={() =>
                    !active &&
                    patch({ ...blankBlock(id), subject: draft.subject, chapter: draft.chapter, topics: draft.topics })
                  }
                  className={`rounded-(--shape-md) border p-3 text-left transition-colors ${
                    active ? "border-primary bg-primary/5" : "border-border hover:border-foreground/20"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{blurb}</p>
                </button>
              );
            })}
          </div>
        </FormSection>
      )}

      <FormSection title="Placement">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="block-subject" label="Subject" required>
            <LookupSelect
              id="block-subject"
              value={draft.subject}
              // The chapter and topics belong to the previous subject.
              onChange={(v) => patch({ subject: v, chapter: "", topics: [] })}
              options={subjects.data}
              placeholder="Pick a subject"
              className="w-full"
            />
          </Field>
          <Field id="block-chapter" label="Chapter">
            <LookupSelect
              id="block-chapter"
              value={draft.chapter}
              onChange={(v) => patch({ chapter: v, topics: [] })}
              options={chapters.data}
              placeholder={draft.subject ? "No chapter" : "Pick a subject first"}
              allLabel="No chapter"
              disabled={!draft.subject}
              className="w-full"
            />
          </Field>
        </div>

        {draft.chapter && (topics.data?.length ?? 0) > 0 && (
          <ChipSelect
            label="Topics"
            options={topics.data}
            value={draft.topics}
            onChange={(v) => patch({ topics: v })}
          />
        )}
      </FormSection>

      {draft.kind === "group" && (
        <FormSection title="Stimulus" description="The passage, table or figure every question below refers to.">
          <Field id="block-stimulus-type" label="Stimulus type">
            <LookupSelect
              id="block-stimulus-type"
              value={draft.stimulus_type}
              onChange={(v) => patch({ stimulus_type: v })}
              options={STIMULUS_TYPES}
              placeholder="Pick a type"
              className="w-44"
            />
          </Field>
          <ContentField
            id="block-stimulus"
            label="Stimulus"
            rows={5}
            value={draft.stimulus_content}
            onChange={(v) => patch({ stimulus_content: v })}
            placeholder="HTML and LaTeX"
          />
        </FormSection>
      )}

      <FormSection title={draft.kind === "group" ? "Questions" : "Question"}>
        {draft.questions.map((question) => (
          <QuestionEditor
            key={question.key}
            question={question}
            grouped={draft.kind === "group"}
            onChange={(changes) => changeQuestion(question.key, changes)}
            onRemove={
              draft.kind === "group" && draft.questions.length > 1
                ? () => patch({ questions: draft.questions.filter((q) => q.key !== question.key) })
                : undefined
            }
          />
        ))}
        {draft.kind === "group" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const last = draft.questions[draft.questions.length - 1];
              patch({
                questions: [
                  ...draft.questions,
                  blankQuestion(last?.question_type ?? "cq", PART_LABELS[draft.questions.length] ?? ""),
                ],
              });
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add question
          </Button>
        )}
      </FormSection>
    </FormSheet>
  );
}
