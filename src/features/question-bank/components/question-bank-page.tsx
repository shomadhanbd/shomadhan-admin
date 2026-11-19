"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Library, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSubjects } from "@/lib/lookups";
import { chaptersApi, curriculumKeys } from "@/features/curriculum/api";
import { refreshAfterQuestionChange } from "@/features/question-bank/refresh";
import { QUESTION_BLOCKS, questionBlockKeys } from "@/features/question-bank/api";
import { QUESTION_TYPES, QUESTION_TYPE_LABELS } from "@/features/question-bank/constants";
import { useCrudList } from "@/hooks/use-crud-list";
import { useUrlState } from "@/hooks/use-url-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, ListToolbar, PageHeader, SearchInput, TimeAgo } from "@/components/shared/page-shell";
import { RichContent } from "@/components/shared/rich-content";
import { RowActions } from "@/components/shared/row-actions";
import type { QuestionBlock } from "@/features/question-bank/types";
import { blockPreview } from "@/features/question-bank/preview";

const preview = (block: QuestionBlock) => blockPreview(block) || "Empty question";

export function QuestionBankPage() {
  const queryClient = useQueryClient();
  const subjects = useSubjects();
  const [subject, setSubject] = useUrlState("subject");
  const [chapter, setChapter] = useUrlState("chapter");
  const [type, setType] = useUrlState("type");
  const router = useRouter();

  const chapters = useQuery({
    queryKey: [...curriculumKeys.chapters.lookup, subject],
    queryFn: () => chaptersApi.bySubject(Number(subject)),
    enabled: Boolean(subject),
  });

  const {
    rows,
    total,
    isLoading,
    isFetching,
    search,
    onSearch,
    setPage,
    sort,
    onSort,
    deleting,
    setDeleting,
    remove,
    pagination,
  } = useCrudList<QuestionBlock>({
    key: questionBlockKeys.all[0],
    path: QUESTION_BLOCKS,
    params: { subject, chapter, question_type: type },
    onDeleted: () => {
      refreshAfterQuestionChange(queryClient);
      toast.success("Question deleted");
    },
  });

  const columns: Column<QuestionBlock>[] = [
    {
      key: "question",
      header: "Question",
      cell: (b) => (
        // line-clamp, not truncate: a nowrap cell is as wide as its whole text, and pushed the table past its frame.
        <div className="min-w-0">
          {/* Through RichContent so a formula in the first line reads as maths, not as `$x^2$`. */}
          <Link href={`/question-bank/${b.id}`} className="block hover:text-primary">
            <RichContent content={preview(b)} className="line-clamp-2 font-medium" />
          </Link>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {b.slug}
            {b.kind === "group" && ` · ${b.question_count} ${b.question_count === 1 ? "question" : "questions"}`}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      width: "130px",
      cell: (b) => (
        <div className="flex flex-wrap gap-1">
          {[...new Set(b.questions.map((q) => q.question_type))].map((t) => (
            <Badge key={t} variant="secondary">
              {QUESTION_TYPE_LABELS[t]}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "placement",
      header: "Subject",
      secondary: true,
      width: "200px",
      cell: (b) => (
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm text-foreground">{b.subject_name}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{b.chapter_name ?? "No chapter"}</p>
        </div>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      secondary: true,
      width: "130px",
      sortKey: "updated_at",
      sortFirst: "desc",
      cell: (b) => <TimeAgo value={b.updated_at} className="text-muted-foreground" />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "56px",
      cell: (b) => (
        <div className="flex justify-end">
          <RowActions
            name={`question ${b.slug}`}
            actions={[
              {
                icon: <Pencil className="h-4 w-4" />,
                label: "Edit",
                onClick: () => router.push(`/question-bank/${b.id}/edit`),
              },
              {
                icon: <Trash2 className="h-4 w-4" />,
                label: "Delete",
                onClick: () => setDeleting(b),
                destructive: true,
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const filtered = Boolean(search || subject || chapter || type);
  function clearFilters() {
    onSearch("");
    setSubject("");
    setChapter("");
    setType("");
  }
  const newButton = (size?: "lg") => (
    <Button
      size={size}
      onClick={() => {
        // A new question starts in the subject and chapter the list is filtered to.
        const filters = new URLSearchParams(Object.entries({ subject, chapter }).filter(([, v]) => v));
        router.push(`/question-bank/new${filters.size ? `?${filters}` : ""}`);
      }}
    >
      <Plus className="h-4 w-4" />
      New question
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Question bank" description="Every question students can practise or be tested on">
        {newButton("lg")}
      </PageHeader>

      <ListToolbar total={isLoading ? undefined : total} noun="questions" filtered={filtered} onClear={clearFilters}>
        <SearchInput value={search} onChange={onSearch} placeholder="Search question text…" />
        <LookupSelect
          ariaLabel="Filter by subject"
          value={subject}
          onChange={(v) => {
            setSubject(v);
            setChapter("");
            setPage(1);
          }}
          options={subjects.data}
          placeholder="All subjects"
          allLabel="All subjects"
          className="w-44 bg-card"
        />
        <LookupSelect
          ariaLabel="Filter by chapter"
          value={chapter}
          onChange={(v) => {
            setChapter(v);
            setPage(1);
          }}
          options={chapters.data}
          placeholder={subject ? "All chapters" : "Pick a subject first"}
          allLabel="All chapters"
          disabled={!subject}
          className="w-48 bg-card"
        />
        <LookupSelect
          ariaLabel="Filter by question type"
          value={type}
          onChange={(v) => {
            setType(v);
            setPage(1);
          }}
          options={QUESTION_TYPES}
          placeholder="All types"
          allLabel="All types"
          className="w-44 bg-card"
        />
      </ListToolbar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(b) => b.id}
        rowHref={(b) => `/question-bank/${b.id}`}
        sort={sort}
        onSort={onSort}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          filtered ? (
            <EmptyState
              icon={<Library className="h-5 w-5" />}
              title="No questions match these filters"
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              firstRun
              title="No questions yet"
              description="A question is filed under a subject and chapter. Add a single MCQ, or a stimulus with several questions under it."
              action={newButton()}
            />
          )
        }
      />

      <Pagination {...pagination} />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this question?"
        description={
          <>
            <span className="font-medium text-foreground">{deleting && preview(deleting)}</span> will be removed for
            good. A question students have practised, one used in a test, or one with reports cannot be deleted.
          </>
        }
        confirmLabel="Delete question"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}
