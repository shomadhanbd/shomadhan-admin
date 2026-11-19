"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag, Library } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/api-error";
import { date } from "@/lib/format";
import { questionBlockKeys, questionBlocksApi } from "@/features/question-bank/api";
import { reportKeys, reportsApi } from "@/features/reports/api";
import { REPORT_REASON_LABELS } from "@/features/reports/constants";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { EmptyState, PageHeader } from "@/components/shared/page-shell";
import type { Report } from "@/features/reports/types";
import { QuestionBlockForm } from "./question-block-form";

/** The report being fixed, kept in view above the editor. */
function ReportBrief({
  report,
  markReviewed,
  onMarkReviewed,
}: {
  report: Report;
  markReviewed: boolean;
  onMarkReviewed: (v: boolean) => void;
}) {
  const open = report.status === "open";
  return (
    <section className="rounded-(--shape-md) bg-warning/10 p-4 ring-1 ring-warning/30">
      <div className="flex flex-wrap items-center gap-2">
        <Flag className="h-4 w-4 text-warning" />
        <h2 className="text-sm font-semibold text-foreground">Fixing a report</h2>
        <Badge variant="secondary">{REPORT_REASON_LABELS[report.reason]}</Badge>
        {!open && <Badge variant="outline">{report.status === "reviewed" ? "Reviewed" : "Dismissed"}</Badge>}
      </div>
      <p className="mt-2 text-sm text-foreground">{report.description || "No details given."}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        On {report.block_slug}, reported by{" "}
        <Link href={`/users/${report.user}`} className="text-primary hover:underline">
          {report.user_name || report.user_mobile || "a student"}
        </Link>{" "}
        on {date(report.created_at)}
      </p>
      {open && (
        <label htmlFor="report-mark-reviewed" className="mt-3 flex items-center gap-3 text-sm text-foreground">
          <Switch id="report-mark-reviewed" checked={markReviewed} onCheckedChange={onMarkReviewed} />
          Mark the report reviewed when I save
        </label>
      )}
    </section>
  );
}

/** `/question-bank/{id}/edit`: one question's editor on a page of its own. */
export function QuestionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  // Set when opened from Reports' "Fix question": the report stays in view, and saving returns there.
  const reportId = Number(useSearchParams().get("report")) || null;
  const [markReviewed, setMarkReviewed] = useState(true);

  const { data: report } = useQuery({
    queryKey: [...reportKeys.all, "detail", reportId],
    queryFn: () => reportsApi.get(reportId!),
    enabled: reportId !== null,
  });

  async function backToReport() {
    if (report?.status === "open" && markReviewed) {
      try {
        await reportsApi.setStatus(report.id, "reviewed");
        toast.success("Report marked reviewed");
      } catch (err) {
        toast.error(apiError(err));
      }
    }
    queryClient.invalidateQueries({ queryKey: reportKeys.all });
    router.replace("/reports");
  }

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
        <div className="rounded-(--shape-md) surface">
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
      <PageHeader
        title="Edit question"
        description={block.slug}
        backHref={report ? "/reports" : `/question-bank/${block.id}`}
      />
      {report && <ReportBrief report={report} markReviewed={markReviewed} onMarkReviewed={setMarkReviewed} />}
      {/* Keyed on the id only, so a refetch of the same question never resets work in progress. */}
      <QuestionBlockForm
        key={block.id}
        block={block}
        cancelHref={report ? "/reports" : `/question-bank/${block.id}`}
        onSaved={report ? backToReport : undefined}
      />
    </div>
  );
}
