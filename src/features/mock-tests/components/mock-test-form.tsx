"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/api-error";
import { useAcademicGroups, useEducationLevels, useSubjects } from "@/lib/lookups";
import { mockTestKeys, mockTestsApi } from "@/features/mock-tests/api";
import {
  blankMockTest,
  blockMarks,
  draftProblem,
  marksLabel,
  toBody,
  toDraft,
  type MockTestDraft,
} from "@/features/mock-tests/mock-test-draft";
import { QUESTION_TYPE_LABELS } from "@/features/question-bank/constants";
import { useLeaveWarning } from "@/hooks/use-leave-warning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ChipSelect } from "@/components/shared/chip-select";
import { FormSection } from "@/components/shared/form-section";
import { Field } from "@/components/shared/page-shell";
import { SaveBar } from "@/components/shared/save-bar";
import { BlockPickerDialog } from "./block-picker-dialog";
import { PaperEditor } from "./paper-editor";
import type { MockTestDetail } from "@/features/mock-tests/types";

const CARD = "space-y-4 rounded-(--shape-md) surface px-5 py-4";

/**
 * The mock test editor as a page body: details, audience, schedule and rules on the left, the paper being built
 * on the right, and a SaveBar pinned under the header. Saving goes to the test's page.
 */
export function MockTestForm({ test, cancelHref }: { test: MockTestDetail | null; cancelHref: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(test);
  const locked = Boolean(test?.has_attempts);
  const levels = useEducationLevels();
  const groups = useAcademicGroups();
  const subjects = useSubjects();

  const [initial] = useState<MockTestDraft>(() => (test ? toDraft(test) : blankMockTest()));
  const [draft, setDraft] = useState(initial);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const patch = (changes: Partial<MockTestDraft>) => setDraft((d) => ({ ...d, ...changes }));

  // Each list narrows to what the choices above it allow.
  const groupOptions = useMemo(
    () => groups.data?.filter((g) => draft.levels.includes(g.education_level)),
    [groups.data, draft.levels],
  );
  const subjectOptions = useMemo(
    () =>
      subjects.data?.filter(
        (s) =>
          draft.levels.includes(s.education_level) &&
          (draft.groups.length === 0 || draft.groups.includes(s.academic_group)),
      ),
    [subjects.data, draft.levels, draft.groups],
  );

  /** Dropping a level takes its groups and subjects with it; the server would refuse them anyway. */
  function changeLevels(next: number[]) {
    const keptGroups = draft.groups.filter((id) =>
      groups.data?.some((g) => g.id === id && next.includes(g.education_level)),
    );
    const keptSubjects = draft.subjects.filter((id) =>
      subjects.data?.some((s) => s.id === id && next.includes(s.education_level)),
    );
    patch({ levels: next, groups: keptGroups, subjects: keptSubjects });
  }

  /** Dropping a group takes its subjects with it: they vanish from the list, so they could not be unpicked. */
  function changeGroups(next: number[]) {
    const keptSubjects = draft.subjects.filter(
      (id) => next.length === 0 || subjects.data?.some((s) => s.id === id && next.includes(s.academic_group)),
    );
    patch({ groups: next, subjects: keptSubjects });
  }

  const problem = draftProblem(draft);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);
  const totalMarks = draft.blocks.reduce((sum, b) => sum + blockMarks(b), 0);
  const totalQuestions = draft.blocks.reduce((sum, b) => sum + b.questions.length, 0);
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const question of draft.blocks.flatMap((b) => b.questions)) {
      const label = QUESTION_TYPE_LABELS[question.question_type];
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [draft.blocks]);

  const save = useMutation({
    mutationFn: () =>
      isEdit ? mockTestsApi.update(test!.id, toBody(draft, test)) : mockTestsApi.create(toBody(draft)),
    onSuccess: (saved) => {
      // The test's own page reads this entry; set first, so it shows the saved version straight away.
      queryClient.setQueryData([...mockTestKeys.all, "detail", saved.id], saved);
      queryClient.invalidateQueries({ queryKey: mockTestKeys.all });
      toast.success(isEdit ? "Mock test updated" : "Mock test added");
      // Replace, not push: Back from the saved record must not reopen the form it was saved from.
      router.replace(`/mock-tests/${saved.id}`);
    },
    onError: (err) => setError(apiError(err)),
  });

  useLeaveWarning(dirty && !save.isSuccess);

  function submit() {
    if (save.isPending || problem) return;
    setError(null);
    save.mutate();
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
        submitLabel={isEdit ? "Save changes" : "Add mock test"}
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

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,480px)]">
        <div className="min-w-0 space-y-6">
          <section className={CARD}>
            <FormSection title="Details">
              <Field id="test-title" label="Title" required>
                <Input
                  id="test-title"
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="e.g. Physics weekly test 4"
                  autoFocus={!isEdit}
                />
              </Field>
              <Field id="test-subtitle" label="Subtitle">
                <Input
                  id="test-subtitle"
                  value={draft.subtitle}
                  onChange={(e) => patch({ subtitle: e.target.value })}
                  placeholder="e.g. Chapters 1 to 3"
                />
              </Field>
              <Field id="test-description" label="Description" hint="Shown to students before they start.">
                <Textarea
                  id="test-description"
                  value={draft.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  rows={2}
                />
              </Field>
            </FormSection>
          </section>

          <section className={CARD}>
            <FormSection
              title="Audience"
              description="Students see the test when their level and group are chosen here. The subjects limit which questions the paper can hold."
            >
              <ChipSelect
                label="Education levels"
                options={levels.data}
                value={draft.levels}
                onChange={changeLevels}
                empty="No education levels exist yet."
              />
              <ChipSelect
                label="Academic groups"
                options={groupOptions}
                value={draft.groups}
                onChange={changeGroups}
                empty="Pick an education level first."
              />
              <ChipSelect
                label="Subjects"
                options={subjectOptions}
                value={draft.subjects}
                onChange={(v) => patch({ subjects: v })}
                empty="Pick an education level first."
              />
            </FormSection>
          </section>

          <section className={CARD}>
            <FormSection title="Schedule" description="In your own time zone.">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="test-start" label="Starts" required>
                  <Input
                    id="test-start"
                    type="datetime-local"
                    value={draft.start}
                    onChange={(e) => patch({ start: e.target.value })}
                  />
                </Field>
                <Field id="test-end" label="Ends" required>
                  <Input
                    id="test-end"
                    type="datetime-local"
                    value={draft.end}
                    onChange={(e) => patch({ end: e.target.value })}
                  />
                </Field>
                <Field id="test-result" label="Results published" required>
                  <Input
                    id="test-result"
                    type="datetime-local"
                    value={draft.resultPublish}
                    onChange={(e) => patch({ resultPublish: e.target.value })}
                  />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                Students can start between the first two times, and see their scores from the third.
              </p>
            </FormSection>
          </section>

          <section className={CARD}>
            <FormSection title="Rules">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="test-time-limit" label="Time limit (minutes)" required>
                  <Input
                    id="test-time-limit"
                    type="number"
                    min={1}
                    value={draft.timeLimit}
                    onChange={(e) => patch({ timeLimit: e.target.value })}
                  />
                </Field>
                <Field id="test-max-attempts" label="Attempts allowed" required>
                  <Input
                    id="test-max-attempts"
                    type="number"
                    min={1}
                    value={draft.maxAttempts}
                    onChange={(e) => patch({ maxAttempts: e.target.value })}
                  />
                </Field>
                {draft.hasNegativeMarking && (
                  <Field id="test-fraction" label="Deducted per wrong answer" hint="Fraction of the marks, e.g. 0.25.">
                    <Input
                      id="test-fraction"
                      type="number"
                      min={0}
                      max={1}
                      step="0.05"
                      value={draft.negativeFraction}
                      onChange={(e) => patch({ negativeFraction: e.target.value })}
                    />
                  </Field>
                )}
              </div>
              <label htmlFor="test-negative" className="flex items-center gap-3">
                <Switch
                  id="test-negative"
                  checked={draft.hasNegativeMarking}
                  onCheckedChange={(checked: boolean) => patch({ hasNegativeMarking: checked })}
                />
                <span className="text-sm text-foreground">Negative marking</span>
                <span className="text-xs text-muted-foreground">
                  Deduct part of a question&apos;s marks for a wrong answer.
                </span>
              </label>
            </FormSection>
          </section>

          <section className={CARD}>
            <FormSection title="Visibility">
              <label htmlFor="test-published" className="flex items-center gap-3">
                <Switch
                  id="test-published"
                  checked={draft.isPublished}
                  onCheckedChange={(checked: boolean) => patch({ isPublished: checked })}
                />
                <span className="text-sm text-foreground">Published</span>
                <span className="text-xs text-muted-foreground">
                  Students in the audience can see a published test.
                </span>
              </label>
            </FormSection>
          </section>
        </div>

        {/* The paper beside the settings, so the admin sees what the test holds while setting it up. */}
        <aside className="min-w-0 xl:sticky xl:top-36">
          <section className="rounded-(--shape-md) surface">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-3.5">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">Paper</h2>
                <p className="text-xs text-muted-foreground">
                  {totalQuestions} {totalQuestions === 1 ? "question" : "questions"} · {marksLabel(totalMarks)}
                </p>
              </div>
              {!locked && (
                <Button
                  type="button"
                  size="sm"
                  disabled={draft.subjects.length === 0}
                  title={draft.subjects.length === 0 ? "Pick the test's subjects first" : undefined}
                  onClick={() => setPicking(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add questions
                </Button>
              )}
            </header>
            <div className="max-h-[calc(100vh-15rem)] space-y-3 overflow-y-auto px-5 py-4">
              {locked && (
                <p className="flex items-start gap-2 rounded-(--shape-sm) bg-surface-2 p-3 text-xs text-muted-foreground">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Students have already attempted this test, so its questions can no longer change.
                </p>
              )}
              {typeCounts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {typeCounts.map(([label, count]) => (
                    <Badge key={label} variant="secondary">
                      {count} {label}
                    </Badge>
                  ))}
                </div>
              )}
              {!locked && draft.subjects.length === 0 && draft.blocks.length === 0 ? (
                <p className="rounded-(--shape-md) border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  Pick the test&apos;s subjects, then add questions from the bank.
                </p>
              ) : (
                <PaperEditor blocks={draft.blocks} locked={locked} onChange={(blocks) => patch({ blocks })} />
              )}
            </div>
          </section>
        </aside>
      </div>

      {picking && (
        <BlockPickerDialog
          subjects={(subjects.data ?? []).filter((s) => draft.subjects.includes(s.id))}
          selected={draft.blocks}
          onToggle={(block) =>
            patch({
              blocks: draft.blocks.some((b) => b.id === block.id)
                ? draft.blocks.filter((b) => b.id !== block.id)
                : [...draft.blocks, block],
            })
          }
          onOpenChange={(o) => !o && setPicking(false)}
        />
      )}
    </form>
  );
}
