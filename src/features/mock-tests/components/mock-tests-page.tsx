"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { dateTime } from "@/lib/format";
import { MOCK_TESTS, mockTestKeys, mockTestsApi } from "@/features/mock-tests/api";
import { MOCK_TEST_STATUSES, MOCK_TEST_STATUS_LABELS } from "@/features/mock-tests/constants";
import { useCrudList } from "@/hooks/use-crud-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, PageHeader, SearchInput } from "@/components/shared/page-shell";
import { RowActions } from "@/components/shared/row-actions";
import { MockTestSheet } from "./mock-test-sheet";
import type { MockTest, MockTestDetail } from "@/features/mock-tests/types";

export function MockTestsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  /** `"new"`, or the test being edited, while its sheet is open. */
  const [editing, setEditing] = useState<MockTestDetail | "new" | null>(null);
  /** The test whose published switch was flicked, while the admin confirms. */
  const [toggling, setToggling] = useState<MockTest | null>(null);

  const { rows, isLoading, isFetching, search, onSearch, setPage, deleting, setDeleting, remove, pagination } =
    useCrudList<MockTest>({
      key: mockTestKeys.all[0],
      path: MOCK_TESTS,
      params: { status },
      onDeleted: () => toast.success("Mock test deleted"),
    });

  // The list leaves the paper out, so Edit fetches the whole test, then hands the editor its own copy.
  // A mutation, not a query: a query refetches on window focus, which would remount the editor and drop unsaved work.
  const openEditor = useMutation({ mutationFn: mockTestsApi.get, onSuccess: setEditing });

  const publish = useMutation({
    mutationFn: (test: MockTest) => mockTestsApi.update(test.id, { is_published: !test.is_published }),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: mockTestKeys.all });
      toast.success(saved.is_published ? "Mock test published" : "Mock test unpublished");
    },
    onSettled: () => setToggling(null),
  });

  const columns: Column<MockTest>[] = [
    {
      key: "test",
      header: "Test",
      cell: (t) => (
        <div className="max-w-md min-w-0">
          <Link href={`/mock-tests/${t.id}`} className="block truncate font-medium text-foreground hover:text-primary">
            {t.title}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{t.subtitle || `${t.time_limit_minutes} minutes`}</p>
        </div>
      ),
    },
    {
      // "Exam status", not plain "Status": it is where the test is in its schedule, not whether it is published.
      key: "status",
      header: "Exam status",
      width: "130px",
      cell: (t) => (
        <Badge variant={t.status === "draft" ? "outline" : t.status === "running" ? "default" : "secondary"}>
          {MOCK_TEST_STATUS_LABELS[t.status]}
        </Badge>
      ),
    },
    {
      key: "schedule",
      header: "Schedule",
      secondary: true,
      width: "210px",
      cell: (t) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">{dateTime(t.start_time)}</p>
          <p className="truncate text-xs text-muted-foreground">to {dateTime(t.end_time)}</p>
        </div>
      ),
    },
    {
      key: "questions",
      header: "Questions",
      align: "right",
      secondary: true,
      width: "100px",
      cell: (t) => <span className="text-sm text-muted-foreground">{t.question_count}</span>,
    },
    {
      key: "marks",
      header: "Marks",
      align: "right",
      secondary: true,
      width: "90px",
      cell: (t) => <span className="text-sm text-muted-foreground">{Number(t.total_marks)}</span>,
    },
    {
      // A labelled switch, not an icon: publishing changes what students see, so it must not be mistaken for "view".
      key: "published",
      header: "Published",
      width: "110px",
      cell: (t) => (
        <Switch
          aria-label={`${t.title} is published`}
          checked={t.is_published}
          onCheckedChange={() => setToggling(t)}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "170px",
      cell: (t) => (
        <div className="flex justify-end">
          <RowActions
            primary={{ label: "Open", href: `/mock-tests/${t.id}` }}
            actions={[
              {
                icon: <Pencil className="h-4 w-4" />,
                label: `Edit ${t.title}`,
                onClick: () => openEditor.mutate(t.id),
              },
              {
                icon: <Trash2 className="h-4 w-4" />,
                label: `Delete ${t.title}`,
                onClick: () => setDeleting(t),
                destructive: true,
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const filtered = Boolean(search || status);
  const newButton = (size?: "lg") => (
    <Button size={size} onClick={() => setEditing("new")}>
      <Plus className="h-4 w-4" />
      New mock test
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Mock tests" description="Scheduled tests shown to a chosen audience">
        <SearchInput value={search} onChange={onSearch} placeholder="Search mock tests…" />
        <LookupSelect
          ariaLabel="Filter by exam status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={MOCK_TEST_STATUSES}
          placeholder="All exam statuses"
          allLabel="All exam statuses"
          className="w-44 bg-card"
        />
        {newButton("lg")}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          filtered ? (
            <EmptyState
              icon={<ClipboardList className="h-5 w-5" />}
              title="No mock tests match these filters"
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    onSearch("");
                    setStatus("");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              firstRun
              title="No mock tests yet"
              description="A mock test is a timed paper of questions from the bank, open to chosen students between two dates."
              action={newButton()}
            />
          )
        }
      />

      <Pagination {...pagination} />

      {editing !== null && (
        <MockTestSheet
          key={editing === "new" ? "new" : editing.id}
          test={editing === "new" ? null : editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={toggling !== null}
        onOpenChange={(o) => !o && setToggling(null)}
        tone="default"
        title={toggling?.is_published ? "Unpublish this mock test?" : "Publish this mock test?"}
        description={
          <>
            <span className="font-medium text-foreground">{toggling?.title}</span>{" "}
            {toggling?.is_published
              ? "will be hidden from students until it is published again."
              : "will become visible to the students in its audience."}
          </>
        }
        confirmLabel={toggling?.is_published ? "Unpublish" : "Publish"}
        pending={publish.isPending}
        onConfirm={() => toggling && publish.mutate(toggling)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this mock test?"
        description={
          <>
            <span className="font-medium text-foreground">{deleting?.title}</span> will be removed; its questions stay
            in the bank. A test students have attempted cannot be deleted — unpublish it instead.
          </>
        }
        confirmLabel="Delete mock test"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}
