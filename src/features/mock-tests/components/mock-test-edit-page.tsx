"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { mockTestKeys, mockTestsApi } from "@/features/mock-tests/api";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/shared/page-shell";
import { MockTestForm } from "./mock-test-form";

/** `/mock-tests/{id}/edit`: one mock test's editor on a page of its own. */
export function MockTestEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: test, isLoading } = useQuery({
    queryKey: [...mockTestKeys.all, "detail", Number(id)],
    queryFn: () => mockTestsApi.get(Number(id)),
    // Fetched fresh on arrival; not again on window focus, since the form has already copied it into its draft.
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-6 xl:grid-cols-[1fr_480px]">
          <Skeleton className="h-96 rounded-(--shape-md)" />
          <Skeleton className="h-96 rounded-(--shape-md)" />
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit mock test" backHref="/mock-tests" />
        <div className="rounded-(--shape-md) surface">
          <EmptyState
            icon={<ClipboardList className="h-5 w-5" />}
            title="This mock test could not be found"
            description="It may have been deleted."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit mock test" description={test.title} backHref={`/mock-tests/${test.id}`} />
      {/* Keyed on the id only, so a refetch of the same test never resets work in progress. */}
      <MockTestForm key={test.id} test={test} cancelHref={`/mock-tests/${test.id}`} />
    </div>
  );
}
