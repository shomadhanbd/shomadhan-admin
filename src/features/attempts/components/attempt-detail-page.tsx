"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, CircleDashed, ClipboardCheck, Clock, Minus, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiError } from "@/lib/api-error";
import { dateTime } from "@/lib/format";
import { StatTile } from "@/features/dashboard/components/stat-tile";
import { AUTO_MARKED, attemptKeys, attemptsApi } from "@/features/attempts/api";
import { attemptStatus, isFinished, minutesTaken, score } from "@/features/attempts/constants";
import { mockTestKeys, mockTestsApi } from "@/features/mock-tests/api";
import { QUESTION_TYPE_LABELS } from "@/features/question-bank/constants";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailCard, RecordUnavailable } from "@/components/shared/detail-card";
import { PageHeader } from "@/components/shared/page-shell";
import { RichContent } from "@/components/shared/rich-content";
import type { AttemptAnswer } from "@/features/attempts/types";
import type { BankQuestion } from "@/features/question-bank/types";

/** "1.5": marks read best without trailing zeros. */
const marks = (value: string | number) => String(+Number(value).toFixed(2));

const ids = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

/** Right, wrong, waiting to be marked by hand, or skipped: one answer's outcome. */
function Outcome({ answer, question }: { answer?: AttemptAnswer; question: BankQuestion }) {
  const out = marks(question.marks);
  const [Icon, text, tone] = !answer
    ? [Minus, "Skipped", "text-muted-foreground bg-muted"]
    : answer.is_correct === null
      ? [CircleDashed, "Needs marking", "text-warning bg-warning-surface"]
      : answer.is_correct
        ? [Check, `${marks(answer.awarded_marks)} / ${out}`, "text-success bg-success-surface"]
        : Number(answer.awarded_marks) > 0
          ? // Part marks on a written answer: some credit, not full.
            [Check, `${marks(answer.awarded_marks)} / ${out}`, "text-warning bg-warning-surface"]
          : [X, `${marks(answer.awarded_marks)} / ${out}`, "text-destructive bg-destructive-surface"];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        tone,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}

/** What the student gave, against the answer key, in the shape the question's type stores. */
function Response({ answer, question }: { answer?: AttemptAnswer; question: BankQuestion }) {
  const payload = answer?.payload ?? {};
  const picked = ids(payload.selected_option_ids);
  const ordered = ids(payload.ordered_option_ids);

  if (question.question_type === "mcq") {
    return (
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {question.options.map((option) => {
          const chosen = picked.includes(String(option.id));
          const right = option.is_correct === true;
          return (
            <li
              key={option.id}
              className={cn(
                "flex items-start gap-2 rounded-(--shape-sm) border px-2.5 py-1.5",
                chosen && right && "border-success bg-success-surface",
                chosen && !right && "border-destructive bg-destructive-surface",
                !chosen && right && "border-success",
                !chosen && !right && "border-border",
              )}
            >
              <RichContent content={option.content} className="min-w-0 flex-1 text-sm" />
              {(chosen || right) && (
                <span className={cn("shrink-0 text-xs font-medium", right ? "text-success" : "text-destructive")}>
                  {chosen ? "Their answer" : "Correct"}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  if (question.question_type === "ordering" && ordered.length) {
    const byId = new Map(question.options.map((o) => [String(o.id), o]));
    return (
      <ol className="list-decimal space-y-1 pl-5 text-sm">
        {ordered.map((optionId) => (
          <li key={optionId}>
            <RichContent content={byId.get(optionId)?.content ?? `Option ${optionId}`} />
          </li>
        ))}
      </ol>
    );
  }

  // Blanks and written answers: show what was typed, then the model answer to compare.
  const blanks = payload.blanks;
  const typed = Array.isArray(blanks)
    ? blanks.map(String).join(" · ")
    : blanks && typeof blanks === "object"
      ? Object.values(blanks as Record<string, unknown>)
          .map(String)
          .join(" · ")
      : typeof payload.text === "string"
        ? payload.text
        : "";
  return (
    <div className="space-y-2">
      <p
        className={cn(
          "rounded-(--shape-sm) bg-surface-2 px-3 py-2 text-sm whitespace-pre-wrap",
          !typed && "text-muted-foreground",
        )}
      >
        {typed || "No answer"}
      </p>
      {question.model_answer && (
        <div className="text-sm">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Model answer</p>
          <RichContent content={question.model_answer} />
        </div>
      )}
    </div>
  );
}

/** Marks for one written answer, given by hand; saving re-totals the paper. */
function MarkBox({
  attemptId,
  answer,
  question,
}: {
  attemptId: number;
  answer: AttemptAnswer;
  question: BankQuestion;
}) {
  const queryClient = useQueryClient();
  const marked = answer.is_correct !== null;
  const [value, setValue] = useState(marked ? marks(answer.awarded_marks) : "");
  const [error, setError] = useState<string | null>(null);
  const out = Number(question.marks);

  const save = useMutation({
    mutationFn: () => attemptsApi.mark(attemptId, question.id, value),
    onSuccess: (saved) => {
      queryClient.setQueryData([...attemptKeys.all, "detail", attemptId], saved);
      // The lists, the Results page and the test's figures all show this paper's score.
      queryClient.invalidateQueries({ queryKey: attemptKeys.all });
      toast.success(saved.ungraded_count ? `Marked · ${saved.ungraded_count} left to mark` : "Marked · paper graded");
    },
    onError: (err) => setError(apiError(err)),
  });

  const number = Number(value);
  const valid = value !== "" && number >= 0 && number <= out;
  const unchanged = marked && number === Number(answer.awarded_marks);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (valid && !unchanged) save.mutate();
      }}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-(--shape-sm) border px-3 py-2",
        marked ? "border-border" : "border-warning bg-warning-surface/40",
      )}
    >
      <label htmlFor={`marks-${question.id}`} className="text-sm font-medium text-foreground">
        {marked ? "Marks given" : "Give marks"}
      </label>
      <Input
        id={`marks-${question.id}`}
        type="number"
        inputMode="decimal"
        min={0}
        max={out}
        step={0.5}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-20 bg-card"
      />
      <span className="text-sm text-muted-foreground">of {marks(out)}</span>
      <Button type="submit" size="sm" disabled={!valid || unchanged || save.isPending}>
        {save.isPending ? "Saving…" : marked ? "Update" : "Save"}
      </Button>
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
      {value !== "" && !valid && <p className="w-full text-xs text-destructive">Between 0 and {marks(out)}.</p>}
    </form>
  );
}

/** `/mock-tests/{id}/attempts/{attemptId}`: one student's paper, question by question. */
export function AttemptDetailPage({ params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const { id, attemptId } = use(params);
  const attempt = useQuery({
    queryKey: [...attemptKeys.all, "detail", Number(attemptId)],
    queryFn: () => attemptsApi.get(Number(attemptId)),
  });
  const test = useQuery({
    queryKey: [...mockTestKeys.all, "detail", Number(id)],
    queryFn: () => mockTestsApi.get(Number(id)),
  });

  if (attempt.isLoading || test.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-(--shape-md)" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-(--shape-md)" />
      </div>
    );
  }

  const a = attempt.data;
  if (!a || !test.data) {
    return (
      <RecordUnavailable
        title="Attempt"
        backHref={`/mock-tests/${id}?tab=attempts`}
        icon={<ClipboardCheck className="h-5 w-5" />}
        noun="attempt"
        error={attempt.error ?? test.error}
        onRetry={() => {
          attempt.refetch();
          test.refetch();
        }}
      />
    );
  }

  const byQuestion = new Map(a.answers.map((answer) => [answer.question, answer]));
  const status = attemptStatus(a);
  const finished = isFinished(a);
  const s = score(a);
  const minutes = minutesTaken(a);

  return (
    <div className="space-y-6">
      <PageHeader
        title={a.user_name || a.user_mobile}
        description={a.mock_test_title}
        backHref={`/mock-tests/${id}?tab=attempts`}
      >
        <Badge variant={status.variant}>{status.name}</Badge>
        <Link href={`/users/${a.user}`} className={buttonClass({ variant: "outline", size: "lg" })}>
          <UserRound className="h-4 w-4" />
          Student
        </Link>
      </PageHeader>

      {/* Two to a row even on a phone, so the answers start within the first screen. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          size="sm"
          label="Score"
          value={finished ? Number(a.total_score) : 0}
          context={finished ? `${s.text} · ${s.percent}%` : "Not submitted"}
          icon={<ClipboardCheck className="h-4 w-4" />}
          accent={1}
        />
        <StatTile
          size="sm"
          label="Correct"
          value={a.correct_count}
          context={`${a.wrong_count} wrong`}
          icon={<Check className="h-4 w-4" />}
          accent={2}
        />
        <StatTile
          size="sm"
          label="Skipped"
          value={a.unanswered_count}
          context={a.ungraded_count ? `${a.ungraded_count} still to mark` : "Nothing left to mark"}
          icon={<Minus className="h-4 w-4" />}
          accent={3}
        />
        <StatTile
          size="sm"
          label="Minutes taken"
          value={minutes ?? 0}
          context={
            a.submitted_at
              ? `Of ${test.data.time_limit_minutes} allowed · submitted ${dateTime(a.submitted_at)}`
              : `Started ${dateTime(a.started_at)}`
          }
          icon={<Clock className="h-4 w-4" />}
          accent={4}
        />
      </div>

      <DetailCard title="Answers">
        <ol className="divide-y divide-border">
          {test.data.blocks.map((block, index) => (
            <li key={block.id} className="space-y-3 py-5 first:pt-0 last:pb-0">
              {block.stimulus_content && (
                <RichContent content={block.stimulus_content} className="rounded-(--shape-sm) bg-surface-2 px-3 py-2" />
              )}
              {block.questions.map((question, part) => (
                <div key={question.id} className="flex gap-3">
                  <span className="w-6 shrink-0 text-right text-sm font-medium text-muted-foreground tabular-nums">
                    {question.label || (part === 0 ? `${index + 1}.` : "")}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <RichContent content={question.prompt_content} className="min-w-0 flex-1" />
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge variant="secondary">{QUESTION_TYPE_LABELS[question.question_type]}</Badge>
                        <Outcome answer={byQuestion.get(question.id)} question={question} />
                      </div>
                    </div>
                    <Response answer={byQuestion.get(question.id)} question={question} />
                    {finished && byQuestion.has(question.id) && !AUTO_MARKED.includes(question.question_type) && (
                      <MarkBox attemptId={a.id} answer={byQuestion.get(question.id)!} question={question} />
                    )}
                  </div>
                </div>
              ))}
            </li>
          ))}
        </ol>
      </DetailCard>
    </div>
  );
}
