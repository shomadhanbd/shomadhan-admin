"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Clock, ListChecks, Pencil, RotateCcw, Trophy } from "lucide-react";
import { dateTime } from "@/lib/format";
import { useAcademicGroups, useEducationLevels, useSubjects } from "@/lib/lookups";
import { StatTile } from "@/features/dashboard/components/stat-tile";
import { mockTestKeys, mockTestsApi } from "@/features/mock-tests/api";
import { MOCK_TEST_STATUS_LABELS } from "@/features/mock-tests/constants";
import { BlockPreview } from "@/features/question-bank/components/block-preview";
import { QUESTION_TYPE_LABELS } from "@/features/question-bank/constants";
import { Badge } from "@/components/ui/badge";
import { DetailCard, RecordUnavailable } from "@/components/shared/detail-card";
import { buttonClass } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewRow } from "@/components/shared/edit-card";
import { EmptyState, PageHeader } from "@/components/shared/page-shell";
import type { MockTestDetail } from "@/features/mock-tests/types";

/** The names behind a list of ids, in lookup order; an em dash when none resolve. */
function names(ids: number[], rows: { id: number; name: string }[] | undefined): string {
  return (
    (rows ?? [])
      .filter((row) => ids.includes(row.id))
      .map((row) => row.name)
      .join(", ") || "—"
  );
}

/** How many questions of each type the paper holds, most common first. */
function typeCounts(test: MockTestDetail): [string, number][] {
  const counts = new Map<string, number>();
  for (const block of test.blocks) {
    for (const question of block.questions) {
      const label = QUESTION_TYPE_LABELS[question.question_type];
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts].sort((a, b) => b[1] - a[1]);
}

/** One mock test on a page of its own: its numbers, settings and the whole paper with the answer key. */
export function MockTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const levels = useEducationLevels();
  const groups = useAcademicGroups();
  const subjects = useSubjects();

  const {
    data: test,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...mockTestKeys.all, "detail", Number(id)],
    queryFn: () => mockTestsApi.get(Number(id)),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-(--shape-md)" />
      </div>
    );
  }

  if (!test) {
    return (
      <RecordUnavailable
        title="Mock test"
        backHref="/mock-tests"
        icon={<ClipboardList className="h-5 w-5" />}
        noun="mock test"
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={test.title} description={test.subtitle || "Mock test"} backHref="/mock-tests">
        <Badge variant={test.status === "draft" ? "outline" : test.status === "running" ? "default" : "secondary"}>
          {MOCK_TEST_STATUS_LABELS[test.status]}
        </Badge>
        <Link href={`/mock-tests/${test.id}/edit`} className={buttonClass({ size: "lg" })}>
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Questions"
          value={test.question_count}
          context={`In ${test.block_count} ${test.block_count === 1 ? "block" : "blocks"}`}
          icon={<ListChecks className="h-4 w-4" />}
          accent={1}
        />
        <StatTile
          label="Total marks"
          value={Number(test.total_marks)}
          context={
            test.has_negative_marking
              ? `${Number(test.negative_marks_fraction)} of the marks lost per wrong answer`
              : "No negative marking"
          }
          icon={<Trophy className="h-4 w-4" />}
          accent={2}
        />
        <StatTile
          label="Time limit"
          value={test.time_limit_minutes}
          context="Minutes per attempt"
          icon={<Clock className="h-4 w-4" />}
          accent={3}
        />
        <StatTile
          label="Attempts allowed"
          value={test.max_attempts}
          context={test.has_attempts ? "Students have started attempting" : "No attempts yet"}
          icon={<RotateCcw className="h-4 w-4" />}
          accent={4}
        />
      </div>

      {/* The paper is the wide column; the settings sit beside it once the screen has room. */}
      <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px]">
        <DetailCard
          title="Paper"
          aside={
            <div className="flex flex-wrap gap-1.5">
              {typeCounts(test).map(([label, count]) => (
                <Badge key={label} variant="secondary">
                  {count} {label}
                </Badge>
              ))}
            </div>
          }
        >
          {test.blocks.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-5 w-5" />}
              title="No questions on this test yet"
              description="Add questions from the bank before publishing."
              action={
                <Link href={`/mock-tests/${test.id}/edit`} className={buttonClass({ variant: "outline" })}>
                  Add questions
                </Link>
              }
            />
          ) : (
            <ol className="divide-y divide-border">
              {test.blocks.map((block, index) => (
                <li key={block.id} className="py-4 first:pt-0 last:pb-0">
                  <BlockPreview block={block} number={index + 1} />
                </li>
              ))}
            </ol>
          )}
        </DetailCard>

        <div className="space-y-4 xl:order-last">
          <DetailCard title="Audience">
            <dl className="divide-y divide-border">
              <ViewRow label="Education levels">{names(test.applied_education_levels, levels.data)}</ViewRow>
              <ViewRow label="Academic groups">{names(test.applied_academic_groups, groups.data)}</ViewRow>
              <ViewRow label="Subjects">{names(test.applied_subjects, subjects.data)}</ViewRow>
            </dl>
          </DetailCard>
          <DetailCard title="Schedule">
            <dl className="divide-y divide-border">
              <ViewRow label="Starts">{dateTime(test.start_time)}</ViewRow>
              <ViewRow label="Ends">{dateTime(test.end_time)}</ViewRow>
              <ViewRow label="Results published">{dateTime(test.result_publish_time)}</ViewRow>
              <ViewRow label="Visibility">{test.is_published ? "Published" : "Not published"}</ViewRow>
            </dl>
          </DetailCard>
          {test.description && (
            <DetailCard title="Description">
              <p className="text-sm text-foreground">{test.description}</p>
            </DetailCard>
          )}
        </div>
      </div>
    </div>
  );
}
