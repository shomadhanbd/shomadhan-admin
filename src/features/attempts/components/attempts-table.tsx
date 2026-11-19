"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import api from "@/lib/api";
import { ATTEMPTS, attemptKeys } from "@/features/attempts/api";
import { ATTEMPT_STATUSES, attemptStatus, isFinished, score, timeTaken } from "@/features/attempts/constants";
import { MOCK_TESTS, mockTestKeys } from "@/features/mock-tests/api";
import { useCrudList } from "@/hooks/use-crud-list";
import { useUrlState } from "@/hooks/use-url-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, ListToolbar, SearchInput, TimeAgo } from "@/components/shared/page-shell";
import type { Attempt } from "@/features/attempts/types";
import type { Page } from "@/types/api";

/** Every mock test by title, for the Results page's test filter. */
function useMockTestOptions(enabled: boolean) {
  return useQuery({
    queryKey: [...mockTestKeys.all, "lookup"],
    queryFn: async () =>
      (await api.get<Page<{ id: number; title: string }>>(MOCK_TESTS, { params: { page_size: 200 } })).data.results.map(
        (t) => ({ id: t.id, name: t.title }),
      ),
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Students' attempts with their scores. Given `mockTest`, one test's attempts (its page's
 * Attempts tab); without it, every test's, with a Test column and filter (the Results page).
 */
export function AttemptsTable({ mockTest }: { mockTest?: number }) {
  const allTests = mockTest === undefined;
  const tests = useMockTestOptions(allTests);
  const [status, setStatus] = useUrlState("status");
  const [test, setTest] = useUrlState("test");

  const { rows, total, isLoading, isFetching, search, onSearch, setPage, sort, onSort, pagination } =
    useCrudList<Attempt>({
      key: attemptKeys.all[0],
      path: ATTEMPTS,
      params: { mock_test: allTests ? test : String(mockTest), status },
    });

  const columns: Column<Attempt>[] = [
    {
      key: "student",
      header: "Student",
      cell: (a) => (
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar id={a.user} name={a.user_name || a.user_mobile} />
          <div className="min-w-0">
            <p className="line-clamp-1 font-medium text-foreground">{a.user_name || a.user_mobile}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {allTests ? a.mock_test_title : a.user_name ? a.user_mobile : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "score",
      header: "Score",
      width: "170px",
      sortKey: "total_score",
      sortFirst: "desc",
      cell: (a) => {
        if (!isFinished(a)) return <span className="text-sm text-muted-foreground">No score</span>;
        const s = score(a);
        return (
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground tabular-nums">
              {s.text}{" "}
              <span className="font-normal text-muted-foreground">
                {/* Written answers still to mark: the score so far, not the final one. */}
                {a.ungraded_count > 0 ? "so far" : `· ${s.percent}%`}
              </span>
            </p>
            <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, s.percent)}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: "answers",
      header: "Correct",
      align: "right",
      secondary: true,
      width: "110px",
      sortKey: "correct_count",
      sortFirst: "desc",
      cell: (a) =>
        isFinished(a) ? (
          <div className="text-sm">
            <p className="text-foreground tabular-nums">{a.correct_count}</p>
            {a.unanswered_count > 0 && <p className="text-xs text-muted-foreground">{a.unanswered_count} skipped</p>}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">–</span>
        ),
    },
    {
      key: "time",
      header: "Time taken",
      secondary: true,
      width: "120px",
      cell: (a) => <span className="text-sm whitespace-nowrap text-muted-foreground">{timeTaken(a) ?? "–"}</span>,
    },
    {
      key: "submitted",
      header: "Submitted",
      secondary: true,
      width: "140px",
      sortKey: "submitted_at",
      sortFirst: "desc",
      cell: (a) =>
        a.submitted_at ? (
          <TimeAgo value={a.submitted_at} className="text-muted-foreground" />
        ) : (
          <span className="text-sm text-muted-foreground">Not submitted</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      width: "150px",
      cell: (a) => {
        const s = attemptStatus(a);
        return (
          <div className="flex flex-wrap gap-1">
            <Badge variant={s.variant}>{s.name}</Badge>
            {a.ungraded_count > 0 && <Badge variant="outline">{a.ungraded_count} to mark</Badge>}
          </div>
        );
      },
    },
  ];

  const filtered = Boolean(search || status || (allTests && test));
  function clearFilters() {
    onSearch("");
    setStatus("");
    setTest("");
  }

  return (
    <div className="space-y-4">
      <ListToolbar total={isLoading ? undefined : total} noun="attempts" filtered={filtered} onClear={clearFilters}>
        <SearchInput value={search} onChange={onSearch} placeholder="Search student name or mobile…" />
        {allTests && (
          <LookupSelect
            ariaLabel="Filter by mock test"
            value={test}
            onChange={(v) => {
              setTest(v);
              setPage(1);
            }}
            options={tests.data}
            placeholder="All mock tests"
            allLabel="All mock tests"
            className="w-56"
          />
        )}
        <LookupSelect
          ariaLabel="Filter by status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={ATTEMPT_STATUSES}
          placeholder="All statuses"
          allLabel="All statuses"
          className="w-40"
        />
      </ListToolbar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(a) => a.id}
        rowHref={(a) => `/mock-tests/${a.mock_test}/attempts/${a.id}`}
        sort={sort}
        onSort={onSort}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          filtered ? (
            <EmptyState
              icon={<ClipboardCheck className="h-5 w-5" />}
              title="No attempts match these filters"
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<ClipboardCheck className="h-5 w-5" />}
              title={allTests ? "No student has taken a mock test yet" : "No student has taken this test yet"}
              description="Attempts show here as soon as a student starts a test in the app."
            />
          )
        }
      />

      <Pagination {...pagination} />
    </div>
  );
}
