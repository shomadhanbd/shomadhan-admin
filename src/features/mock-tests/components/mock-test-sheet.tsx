"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ChipSelect } from "@/components/shared/chip-select";
import { FormSection, FormSheet } from "@/components/shared/form-sheet";
import { Field } from "@/components/shared/page-shell";
import { BlockPickerDialog } from "./block-picker-dialog";
import { PaperEditor } from "./paper-editor";
import type { MockTestDetail } from "@/features/mock-tests/types";

/** Creates or edits one mock test: details, audience, schedule, rules and the paper. */
export function MockTestSheet({
  test,
  onOpenChange,
}: {
  test: MockTestDetail | null;
  onOpenChange: (o: boolean) => void;
}) {
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

  const problem = draftProblem(draft);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);
  const totalMarks = draft.blocks.reduce((sum, b) => sum + blockMarks(b), 0);
  const totalQuestions = draft.blocks.reduce((sum, b) => sum + b.questions.length, 0);

  const save = useMutation({
    mutationFn: () => (isEdit ? mockTestsApi.update(test!.id, toBody(draft)) : mockTestsApi.create(toBody(draft))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mockTestKeys.all });
      toast.success(isEdit ? "Mock test updated" : "Mock test added");
      onOpenChange(false);
    },
    onError: (err) => setError(apiError(err)),
  });

  return (
    <>
      <FormSheet
        open
        onOpenChange={onOpenChange}
        title={isEdit ? "Edit mock test" : "New mock test"}
        description={isEdit ? test!.title : "A scheduled test for a chosen audience."}
        submitLabel={isEdit ? "Save changes" : "Add mock test"}
        pending={save.isPending}
        canSubmit={!problem}
        error={error}
        summary={
          problem ?? `${totalQuestions} ${totalQuestions === 1 ? "question" : "questions"} · ${marksLabel(totalMarks)}`
        }
        dirty={dirty}
        onSubmit={() => {
          setError(null);
          save.mutate();
        }}
      >
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
          <Field id="test-description" label="Description">
            <Textarea
              id="test-description"
              value={draft.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={2}
            />
          </Field>
        </FormSection>

        <FormSection title="Audience" description="Students see the test when their level and group are chosen here.">
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
            onChange={(v) => patch({ groups: v })}
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

        <FormSection title="Schedule" description="In your own time zone.">
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Field
              id="test-result"
              label="Results published"
              required
              hint="Students see their scores from this moment."
              className="sm:col-span-2"
            >
              <Input
                id="test-result"
                type="datetime-local"
                value={draft.resultPublish}
                onChange={(e) => patch({ resultPublish: e.target.value })}
                className="sm:w-1/2"
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Rules">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="test-time-limit" label="Time limit (minutes)" required>
              <Input
                id="test-time-limit"
                type="number"
                min={1}
                value={draft.timeLimit}
                onChange={(e) => patch({ timeLimit: e.target.value })}
                className="w-28"
              />
            </Field>
            <Field id="test-max-attempts" label="Attempts allowed" required>
              <Input
                id="test-max-attempts"
                type="number"
                min={1}
                value={draft.maxAttempts}
                onChange={(e) => patch({ maxAttempts: e.target.value })}
                className="w-28"
              />
            </Field>
          </div>
          <Field
            id="test-negative"
            label="Negative marking"
            hint="Deduct part of a question's marks for a wrong answer."
          >
            <Switch
              id="test-negative"
              checked={draft.hasNegativeMarking}
              onCheckedChange={(checked: boolean) => patch({ hasNegativeMarking: checked })}
            />
          </Field>
          {draft.hasNegativeMarking && (
            <Field
              id="test-fraction"
              label="Deducted per wrong answer"
              hint="As a fraction of the question's marks, e.g. 0.25."
            >
              <Input
                id="test-fraction"
                type="number"
                min={0}
                max={1}
                step="0.05"
                value={draft.negativeFraction}
                onChange={(e) => patch({ negativeFraction: e.target.value })}
                className="w-28"
              />
            </Field>
          )}
        </FormSection>

        <FormSection
          title="Paper"
          description={
            locked
              ? "Students have already attempted this test, so its questions can no longer change."
              : "The questions on the test, in the order students get them."
          }
        >
          <PaperEditor blocks={draft.blocks} locked={locked} onChange={(blocks) => patch({ blocks })} />
          {!locked && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={draft.subjects.length === 0}
              onClick={() => setPicking(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add questions
            </Button>
          )}
          {!locked && draft.subjects.length === 0 && (
            <p className="text-xs text-muted-foreground">Pick the test&apos;s subjects first.</p>
          )}
        </FormSection>

        <FormSection title="Visibility">
          <Field id="test-published" label="Published" hint="Students cannot see an unpublished test.">
            <Switch
              id="test-published"
              checked={draft.isPublished}
              onCheckedChange={(checked: boolean) => patch({ isPublished: checked })}
            />
          </Field>
        </FormSection>
      </FormSheet>

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
    </>
  );
}
