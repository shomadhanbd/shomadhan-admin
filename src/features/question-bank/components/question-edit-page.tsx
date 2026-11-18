"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Library } from "lucide-react";
import { questionBlockKeys, questionBlocksApi } from "@/features/question-bank/api";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/shared/page-shell";
import { QuestionBlockForm } from "./question-block-form";

/** `/question-bank/{id}/edit`: one question's editor on a page of its own. */
export function QuestionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: block, isLoading } = useQuery({
    queryKey: [...questionBlockKeys.all, "detail", Number(id)],
    queryFn: () => questionBlocksApi.get(Number(id)),
    // Fetched fresh on arrival; not again on window focus, since the form has already copied it into its draft.
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-40 rounded-(--shape-md)" />
        <Skeleton className="h-96 rounded-(--shape-md)" />
      </div>
    );
  }

  if (!block) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit question" backHref="/question-bank" />
        <div className="rounded-(--shape-md) bg-card shadow-sm ring-1 ring-foreground/[0.07]">
          <EmptyState
            icon={<Library className="h-5 w-5" />}
            title="This question could not be found"
            description="It may have been deleted."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit question" description={block.slug} backHref={`/question-bank/${block.id}`} />
      {/* Keyed on the id only, so a refetch of the same question never resets work in progress. */}
      <QuestionBlockForm key={block.id} block={block} cancelHref={`/question-bank/${block.id}`} />
    </div>
  );
}
