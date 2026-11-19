"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Library, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { dateTime } from "@/lib/format";
import { curriculumKeys, topicsApi } from "@/features/curriculum/api";
import { refreshAfterQuestionChange } from "@/features/question-bank/refresh";
import { questionBlockKeys, questionBlocksApi } from "@/features/question-bank/api";
import { QUESTION_TYPE_LABELS, STIMULUS_TYPES } from "@/features/question-bank/constants";
import { Badge } from "@/components/ui/badge";
import { DetailCard, RecordUnavailable } from "@/components/shared/detail-card";
import { Button, buttonClass } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ViewRow } from "@/components/shared/edit-card";
import { PageHeader } from "@/components/shared/page-shell";
import { BlockPreview } from "./block-preview";

/** `/question-bank/{id}`: one question as students see it, with its answer key, placement and details. */
export function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const {
    data: block,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...questionBlockKeys.all, "detail", Number(id)],
    queryFn: () => questionBlocksApi.get(Number(id)),
  });
  // The block stores topic ids; their names come from the chapter's topic list.
  const topics = useQuery({
    queryKey: [...curriculumKeys.topics.all, "by-chapter", String(block?.chapter ?? "")],
    queryFn: () => topicsApi.byChapter(block!.chapter!),
    enabled: Boolean(block?.chapter && block.topics.length),
  });

  const remove = useMutation({
    mutationFn: () => questionBlocksApi.remove(Number(id)),
    onSuccess: () => {
      // Dropped first: invalidating it would refetch the record just deleted, twice, into 404s.
      queryClient.removeQueries({ queryKey: [...questionBlockKeys.all, "detail", Number(id)] });
      refreshAfterQuestionChange(queryClient);
      toast.success("Question deleted");
      router.push("/question-bank");
    },
    // A refused delete (practised, on a test, reported) is explained by the global toast.
    onSettled: () => setDeleting(false),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-96 rounded-(--shape-md)" />
      </div>
    );
  }

  if (!block) {
    return (
      <RecordUnavailable
        title="Question"
        backHref="/question-bank"
        icon={<Library className="h-5 w-5" />}
        noun="question"
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  const totalMarks = block.questions.reduce((sum, q) => sum + Number(q.marks), 0);
  const types = [...new Set(block.questions.map((q) => QUESTION_TYPE_LABELS[q.question_type]))];
  const topicNames = (topics.data ?? []).filter((t) => block.topics.includes(t.id)).map((t) => t.name);

  return (
    <div className="space-y-6">
      {/* Titled by its id: the content itself is HTML and LaTeX, which a plain-text heading would show raw. */}
      <PageHeader
        title={`Question ${block.slug}`}
        description={[
          block.kind === "group" ? "Stimulus group" : "Single question",
          block.subject_name,
          block.chapter_name,
        ]
          .filter(Boolean)
          .join(" · ")}
        backHref="/question-bank"
      >
        <Link href={`/question-bank/${block.id}/edit`} className={buttonClass({ size: "lg" })}>
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
        <Button size="lg" variant="outline" onClick={() => setDeleting(true)}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </PageHeader>

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_340px]">
        <DetailCard
          title={block.questions.length === 1 ? "Question" : `${block.questions.length} questions`}
          aside={
            <div className="flex flex-wrap gap-1.5">
              {types.map((type) => (
                <Badge key={type} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
          }
        >
          <BlockPreview block={block} />
        </DetailCard>

        <div className="space-y-4">
          <DetailCard title="Placement">
            <dl className="divide-y divide-border">
              <ViewRow label="Subject">{block.subject_name}</ViewRow>
              <ViewRow label="Chapter">{block.chapter_name ?? "No chapter"}</ViewRow>
              <ViewRow label="Topics">
                {block.topics.length === 0 ? "None" : topicNames.join(", ") || `${block.topics.length} topics`}
              </ViewRow>
            </dl>
          </DetailCard>
          <DetailCard title="Details">
            <dl className="divide-y divide-border">
              <ViewRow label="Total marks">{totalMarks}</ViewRow>
              {block.kind === "group" && (
                <ViewRow label="Stimulus type">
                  {STIMULUS_TYPES.find((t) => t.id === block.stimulus_type)?.name ?? "—"}
                </ViewRow>
              )}
              <ViewRow label="Order in chapter">{block.order_in_chapter}</ViewRow>
              <ViewRow label="Last updated">{dateTime(block.updated_at)}</ViewRow>
            </dl>
          </DetailCard>
        </div>
      </div>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete this question?"
        description={
          <>
            <span className="font-medium text-foreground">{block.slug}</span> will be removed for good. A question
            students have practised, one used in a test, or one with reports cannot be deleted.
          </>
        }
        confirmLabel="Delete question"
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}
