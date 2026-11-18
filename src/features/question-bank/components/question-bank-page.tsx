"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Library, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { plainText } from "@/lib/format";
import { useSubjects } from "@/lib/lookups";
import { chaptersApi, curriculumKeys } from "@/features/curriculum/api";
import { QUESTION_BLOCKS, questionBlockKeys } from "@/features/question-bank/api";
import { QUESTION_TYPES, QUESTION_TYPE_LABELS } from "@/features/question-bank/constants";
import { useCrudList } from "@/hooks/use-crud-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, PageHeader, SearchInput } from "@/components/shared/page-shell";
import { RichContent } from "@/components/shared/rich-content";
import { RowActions } from "@/components/shared/row-actions";
import { QuestionBlockSheet } from "./question-block-sheet";
import type { QuestionBlock } from "@/features/question-bank/types";

/** The words a row is recognised by: a group's stimulus, else its first question. */
function preview(block: QuestionBlock): string {
  return plainText(block.stimulus_content) || plainText(block.questions[0]?.prompt_content) || "Empty question";
}

export function QuestionBankPage() {
  const queryClient = useQueryClient();
  const subjects = useSubjects();
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [type, setType] = useState("");
  const [editing, setEditing] = useState<QuestionBlock | null | "new">(null);

  const chapters = useQuery({
    queryKey: [...curriculumKeys.chapters.lookup, subject],
    queryFn: () => chaptersApi.bySubject(Number(subject)),
    enabled: Boolean(subject),
  });

  const { rows, isLoading, isFetching, search, onSearch, setPage, deleting, setDeleting, remove, pagination } =
    useCrudList<QuestionBlock>({
      key: questionBlockKeys.all[0],
      path: QUESTION_BLOCKS,
      params: { subject, chapter, question_type: type },
      onDeleted: () => {
        for (const key of ["chapters", "subjects", "academicGroups", "educationLevels"] as const) {
          queryClient.invalidateQueries({ queryKey: curriculumKeys[key].all });
        }
        toast.success("Question deleted");
      },
    });

  const columns: Column<QuestionBlock>[] = [
    {
      key: "question",
      header: "Question",
      cell: (b) => (
        <div className="max-w-xl min-w-0">
          {/* Through RichContent so a formula in the first line reads as maths, not as `$x^2$`. */}
          <RichContent content={preview(b)} className="truncate font-medium" />
          <p className="truncate text-xs text-muted-foreground">
            {b.slug}
            {b.kind === "group" && ` · ${b.question_count} ${b.question_count === 1 ? "question" : "questions"}`}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      width: "150px",
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
      width: "220px",
      cell: (b) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">{b.subject_name}</p>
          <p className="truncate text-xs text-muted-foreground">{b.chapter_name ?? "No chapter"}</p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "110px",
      cell: (b) => (
        <div className="flex justify-end">
          <RowActions
            actions={[
              { icon: <Pencil className="h-4 w-4" />, label: `Edit ${b.slug}`, onClick: () => setEditing(b) },
              {
                icon: <Trash2 className="h-4 w-4" />,
                label: `Delete ${b.slug}`,
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
  const newButton = (size?: "lg") => (
    <Button size={size} onClick={() => setEditing("new")}>
      <Plus className="h-4 w-4" />
      New question
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Question bank" description="Every question students can practise or be tested on">
        {newButton("lg")}
      </PageHeader>

      {/* A row of their own: four controls do not fit beside the title on a laptop screen. */}
      <div className="flex flex-wrap items-center gap-2">
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
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(b) => b.id}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          filtered ? (
            <EmptyState
              icon={<Library className="h-5 w-5" />}
              title="No questions match these filters"
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    onSearch("");
                    setSubject("");
                    setChapter("");
                    setType("");
                  }}
                >
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

      {editing !== null && (
        <QuestionBlockSheet
          key={editing === "new" ? "new" : editing.id}
          block={editing === "new" ? null : editing}
          defaults={{ subject, chapter }}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this question?"
        description={
          <>
            <span className="font-medium text-foreground">{deleting && preview(deleting)}</span> will be removed, along
            with students&apos; practice history for it. A question used in a test, or one that has reports or exam
            answers, cannot be deleted.
          </>
        }
        confirmLabel="Delete question"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}
