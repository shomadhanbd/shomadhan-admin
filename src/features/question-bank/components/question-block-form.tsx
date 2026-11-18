"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Plus } from "lucide-react";
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
  toPreview,
  type BlockDraft,
  type QuestionDraft,
} from "@/features/question-bank/question-draft";
import { useLeaveWarning } from "@/hooks/use-leave-warning";
import { Button } from "@/components/ui/button";
import { ChipSelect } from "@/components/shared/chip-select";
import { FormSection } from "@/components/shared/form-sheet";
import { LookupSelect } from "@/components/shared/lookup-select";
import { Field } from "@/components/shared/page-shell";
import { SaveBar } from "@/components/shared/save-bar";
import { ContentField } from "@/components/shared/rich-content";
import { BlockPreview } from "./block-preview";
import { QuestionEditor } from "./question-editor";
import type { BlockKind, QuestionBlock } from "@/features/question-bank/types";

const KINDS: { id: BlockKind; title: string; blurb: string }[] = [
  { id: "standalone", title: "Single question", blurb: "One question on its own, usually an MCQ." },
  { id: "group", title: "Stimulus group", blurb: "A shared passage with questions under it, like a CQ." },
];

const CARD = "space-y-4 rounded-(--shape-md) bg-card px-5 py-4 shadow-sm ring-1 ring-foreground/[0.07]";

/**
 * Each field's own preview is hidden on wide screens, where the student view beside the form shows the whole
 * question at once; below that width the field previews are the only ones.
 */
const FIELD_PREVIEW = "xl:hidden";

/**
 * The question editor as a page body: placement, stimulus and questions on the left, the question as students
 * will see it on the right, and a SaveBar pinned under the header. Saving goes to the question's page.
 */
export function QuestionBlockForm({
  block,
  defaults = { subject: "", chapter: "" },
  cancelHref,
}: {
  block: QuestionBlock | null;
  /** Where a new question starts, e.g. the subject and chapter the list was filtered to. */
  defaults?: { subject: string; chapter: string };
  cancelHref: string;
}) {
  const router = useRouter();
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
  const preview = useMemo(() => toPreview(draft), [draft]);

  const save = useMutation({
    mutationFn: () =>
      isEdit ? questionBlocksApi.update(block!.id, toBody(draft)) : questionBlocksApi.create(toBody(draft)),
    onSuccess: (saved) => {
      // The question's page reads this entry; set first, so it shows the saved version straight away.
      queryClient.setQueryData([...questionBlockKeys.all, "detail", saved.id], saved);
      queryClient.invalidateQueries({ queryKey: questionBlockKeys.all });
      // Question counts on the curriculum screens follow every save.
      for (const key of ["chapters", "subjects", "academicGroups", "educationLevels"] as const) {
        queryClient.invalidateQueries({ queryKey: curriculumKeys[key].all });
      }
      toast.success(isEdit ? "Question updated" : "Question added");
      // Replace, not push: Back from the saved record must not reopen the form it was saved from.
      router.replace(`/question-bank/${saved.id}`);
    },
    onError: (err) => setError(apiError(err)),
  });

  // Closing the tab or reloading with unsaved work gets the browser's own "leave site?" prompt.
  useLeaveWarning(dirty && !save.isSuccess);

  function submit() {
    if (save.isPending || problem) return;
    setError(null);
    save.mutate();
  }

  function changeQuestion(key: string, changes: Partial<QuestionDraft>) {
    patch({ questions: draft.questions.map((q) => (q.key === key ? { ...q, ...changes } : q)) });
  }

  /** Swaps two neighbouring questions; their labels stay in place, so the parts still read a, b, c, d. */
  function moveQuestion(index: number, by: -1 | 1) {
    const next = [...draft.questions];
    const [a, b] = [next[index], next[index + by]];
    next[index] = { ...b, label: a.label };
    next[index + by] = { ...a, label: b.label };
    patch({ questions: next });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          submit();
        }
      }}
      className="space-y-6"
    >
      <SaveBar
        problem={problem}
        ready={dirty || !isEdit ? "Ready to save" : "No changes yet"}
        dirty={dirty}
        pending={save.isPending}
        submitLabel={isEdit ? "Save changes" : "Add question"}
        cancelHref={cancelHref}
      />

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-(--shape-sm) bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        <div className="min-w-0 space-y-6">
          {!isEdit && (
            <section className={CARD}>
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
                          patch({
                            ...blankBlock(id),
                            subject: draft.subject,
                            chapter: draft.chapter,
                            topics: draft.topics,
                          })
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
            </section>
          )}

          <section className={CARD}>
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
          </section>

          {draft.kind === "group" && (
            <section className={CARD}>
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
                  rows={6}
                  value={draft.stimulus_content}
                  onChange={(v) => patch({ stimulus_content: v })}
                  previewClassName={FIELD_PREVIEW}
                />
              </FormSection>
            </section>
          )}

          <section className={CARD}>
            <FormSection
              title={draft.kind === "group" ? `Questions (${draft.questions.length})` : "Question"}
              description={
                isEdit && draft.kind === "group"
                  ? "A question students have already practised cannot be removed, only edited."
                  : undefined
              }
            >
              {draft.questions.map((question, index) => (
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
                  onMove={
                    draft.kind === "group" && draft.questions.length > 1
                      ? {
                          up: index > 0 ? () => moveQuestion(index, -1) : undefined,
                          down: index < draft.questions.length - 1 ? () => moveQuestion(index, 1) : undefined,
                        }
                      : undefined
                  }
                  previewClassName={FIELD_PREVIEW}
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
          </section>
        </div>

        {/* The whole question as students will see it, updating as you type; it scrolls on its own if long. */}
        <aside className="hidden xl:sticky xl:top-36 xl:block">
          <section className="rounded-(--shape-md) bg-card shadow-sm ring-1 ring-foreground/[0.07]">
            <header className="border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold text-foreground">Student view</h2>
              <p className="text-xs text-muted-foreground">With the answer key, which students only see afterwards.</p>
            </header>
            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto px-5 py-4">
              {preview.stimulus_content.trim() || preview.questions.some((q) => q.prompt_content) ? (
                <BlockPreview block={preview} />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  The question appears here as you write it.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
