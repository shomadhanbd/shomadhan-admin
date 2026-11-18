"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Flag, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { date, plainText } from "@/lib/format";
import { QUESTION_TYPE_LABELS } from "@/features/question-bank/constants";
import { REPORTS, reportKeys, reportsApi } from "@/features/reports/api";
import { REPORT_REASONS, REPORT_REASON_LABELS, REPORT_STATUSES } from "@/features/reports/constants";
import { useCrudList } from "@/hooks/use-crud-list";
import { useUrlState } from "@/hooks/use-url-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, PageHeader, SearchInput } from "@/components/shared/page-shell";
import { RichContent } from "@/components/shared/rich-content";
import { RowActions } from "@/components/shared/row-actions";
import type { Report, ReportStatus } from "@/features/reports/types";

const STATUS_TOAST: Record<ReportStatus, string> = {
  open: "Report reopened",
  reviewed: "Report marked reviewed",
  dismissed: "Report dismissed",
};

export function ReportsPage() {
  const queryClient = useQueryClient();
  // The queue opens on what still needs attention.
  const [status, setStatus] = useUrlState("status", "open");
  const [reason, setReason] = useUrlState("reason");
  const router = useRouter();

  const { rows, isLoading, isFetching, search, onSearch, setPage, deleting, setDeleting, remove, pagination } =
    useCrudList<Report>({
      key: reportKeys.all[0],
      path: REPORTS,
      params: { status, reason },
      onDeleted: () => toast.success("Report deleted"),
    });

  const changeStatus = useMutation({
    mutationFn: ({ report, next }: { report: Report; next: ReportStatus }) => reportsApi.setStatus(report.id, next),
    onSuccess: (_saved, { next }) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
      toast.success(STATUS_TOAST[next]);
    },
  });

  const columns: Column<Report>[] = [
    {
      key: "report",
      header: "Report",
      cell: (r) => (
        <div className="max-w-sm min-w-0 space-y-1">
          <Badge variant="secondary">{REPORT_REASON_LABELS[r.reason]}</Badge>
          <p className="line-clamp-2 text-sm text-foreground">{r.description || "No details given"}</p>
        </div>
      ),
    },
    {
      key: "question",
      header: "Question",
      cell: (r) => (
        <div className="max-w-sm min-w-0">
          <Link href={`/question-bank/${r.block}`} className="block hover:text-primary">
            <RichContent content={plainText(r.question_prompt)} className="truncate font-medium" />
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {r.block_slug} · {QUESTION_TYPE_LABELS[r.question_type]}
          </p>
        </div>
      ),
    },
    {
      key: "user",
      header: "Reported by",
      secondary: true,
      width: "170px",
      cell: (r) => (
        <div className="min-w-0">
          <Link href={`/users/${r.user}`} className="block truncate text-sm text-foreground hover:text-primary">
            {r.user_name || r.user_mobile || "—"}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{date(r.created_at)}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      secondary: true,
      width: "110px",
      cell: (r) =>
        r.status === "open" ? (
          <Badge variant="secondary">Open</Badge>
        ) : (
          <Badge variant="outline">{r.status === "reviewed" ? "Reviewed" : "Dismissed"}</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "170px",
      cell: (r) => {
        const name = `the report on ${r.block_slug}`;
        const move = (next: ReportStatus) => () => changeStatus.mutate({ report: r, next });
        return (
          <div className="flex justify-end">
            <RowActions
              actions={[
                {
                  icon: <Pencil className="h-4 w-4" />,
                  label: `Fix question ${r.block_slug}`,
                  onClick: () => router.push(`/question-bank/${r.block}/edit?report=${r.id}`),
                },
                ...(r.status === "open"
                  ? [
                      {
                        icon: <Check className="h-4 w-4" />,
                        label: `Mark ${name} reviewed`,
                        onClick: move("reviewed"),
                      },
                      { icon: <X className="h-4 w-4" />, label: `Dismiss ${name}`, onClick: move("dismissed") },
                    ]
                  : [{ icon: <RotateCcw className="h-4 w-4" />, label: `Reopen ${name}`, onClick: move("open") }]),
                {
                  icon: <Trash2 className="h-4 w-4" />,
                  label: `Delete ${name}`,
                  onClick: () => setDeleting(r),
                  destructive: true,
                },
              ]}
            />
          </div>
        );
      },
    },
  ];

  const filtered = Boolean(search || status || reason);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Problems students have flagged on questions">
        <SearchInput value={search} onChange={onSearch} placeholder="Search reports…" />
        <LookupSelect
          ariaLabel="Filter by status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={REPORT_STATUSES}
          placeholder="All statuses"
          allLabel="All statuses"
          className="w-36 bg-card"
        />
        <LookupSelect
          ariaLabel="Filter by reason"
          value={reason}
          onChange={(v) => {
            setReason(v);
            setPage(1);
          }}
          options={REPORT_REASONS}
          placeholder="All reasons"
          allLabel="All reasons"
          className="w-36 bg-card"
        />
      </PageHeader>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          // The default view is already filtered to open reports, so an empty queue is good news, not a dead end.
          status === "open" && !search && !reason ? (
            <EmptyState
              icon={<Check className="h-5 w-5" />}
              title="No open reports"
              description="Reports students file from the app appear here until they are reviewed or dismissed."
            />
          ) : (
            <EmptyState
              icon={<Flag className="h-5 w-5" />}
              title={filtered ? "No reports match these filters" : "No reports yet"}
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    onSearch("");
                    setStatus("open");
                    setReason("");
                  }}
                >
                  Back to open reports
                </Button>
              }
            />
          )
        }
      />

      <Pagination {...pagination} />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this report?"
        description={
          <>
            The report on <span className="font-medium text-foreground">{deleting?.block_slug}</span> will be removed
            for good. To keep a record, mark it reviewed or dismiss it instead.
          </>
        }
        confirmLabel="Delete report"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}
