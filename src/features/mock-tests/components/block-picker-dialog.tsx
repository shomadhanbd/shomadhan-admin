"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { chaptersApi, curriculumKeys } from "@/features/curriculum/api";
import { blockMarks, marksLabel } from "@/features/mock-tests/mock-test-draft";
import { QUESTION_BLOCKS, questionBlockKeys } from "@/features/question-bank/api";
import { QUESTION_TYPES, QUESTION_TYPE_LABELS } from "@/features/question-bank/constants";
import { useCrudList } from "@/hooks/use-crud-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/data-table";
import { LookupSelect } from "@/components/shared/lookup-select";
import { SearchInput } from "@/components/shared/page-shell";
import { RichContent } from "@/components/shared/rich-content";
import type { QuestionBlock } from "@/features/question-bank/types";
import { blockPreview } from "@/features/question-bank/preview";

/** Browse the question bank within the test's subjects and add blocks to its paper. */
export function BlockPickerDialog({
  subjects,
  selected,
  onToggle,
  onOpenChange,
}: {
  /** The test's subjects; a block from any other subject cannot go on the paper. */
  subjects: { id: number; name: string }[];
  selected: QuestionBlock[];
  onToggle: (block: QuestionBlock) => void;
  onOpenChange: (o: boolean) => void;
}) {
  const [chosenSubject, setSubject] = useState("");
  // Derived, not seeded once: the subjects lookup may still be loading when the dialog opens.
  const subject = chosenSubject || String(subjects[0]?.id ?? "");
  const [chapter, setChapter] = useState("");
  const [type, setType] = useState("");

  const chapters = useQuery({
    queryKey: [...curriculumKeys.chapters.lookup, subject],
    queryFn: () => chaptersApi.bySubject(Number(subject)),
    enabled: Boolean(subject),
  });

  const { rows, isLoading, isFetching, search, onSearch, setPage, pagination } = useCrudList<QuestionBlock>({
    key: questionBlockKeys.all[0],
    path: QUESTION_BLOCKS,
    params: { subject, chapter, question_type: type },
    pageSize: 10,
    enabled: Boolean(subject),
    // A dialog over the form: its paging must not rewrite the page's address.
    inUrl: false,
  });

  const selectedIds = new Set(selected.map((b) => b.id));

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,52rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle>Add questions</DialogTitle>
          <DialogDescription>
            From the question bank, within the test&apos;s subjects. {selected.length} on the paper so far.
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <SearchInput value={search} onChange={onSearch} placeholder="Search question text…" />
          <LookupSelect
            ariaLabel="Subject"
            value={subject}
            onChange={(v) => {
              setSubject(v);
              setChapter("");
              setPage(1);
            }}
            options={subjects}
            placeholder="Pick a subject"
            className="w-40"
          />
          <LookupSelect
            ariaLabel="Filter by chapter"
            value={chapter}
            onChange={(v) => {
              setChapter(v);
              setPage(1);
            }}
            options={chapters.data}
            placeholder="All chapters"
            allLabel="All chapters"
            className="w-40"
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
            className="w-36"
          />
        </div>

        <ul
          className={`min-h-0 flex-1 divide-y divide-border overflow-y-auto ${isFetching && !isLoading ? "opacity-60" : ""}`}
        >
          {isLoading &&
            Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="px-5 py-4">
                <Skeleton className="h-4 w-2/3" />
              </li>
            ))}
          {!isLoading && rows.length === 0 && (
            <li className="px-5 py-12 text-center text-sm text-muted-foreground">
              No questions match. Try another chapter or clear the search.
            </li>
          )}
          {rows.map((block) => {
            const added = selectedIds.has(block.id);
            return (
              <li key={block.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <RichContent content={blockPreview(block)} className="truncate font-medium" />
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {[...new Set(block.questions.map((q) => q.question_type))].map((t) => (
                      <Badge key={t} variant="secondary">
                        {QUESTION_TYPE_LABELS[t]}
                      </Badge>
                    ))}
                    <span>
                      {block.chapter_name ?? "No chapter"} · {marksLabel(blockMarks(block))}
                      {block.question_count > 1 && ` · ${block.question_count} questions`}
                    </span>
                  </p>
                </div>
                <Button
                  type="button"
                  variant={added ? "outline" : "default"}
                  size="sm"
                  aria-pressed={added}
                  aria-label={`${added ? "Remove" : "Add"} ${block.slug}`}
                  onClick={() => onToggle(block)}
                  className="w-24 shrink-0"
                >
                  {added ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {added ? "Added" : "Add"}
                </Button>
              </li>
            );
          })}
        </ul>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          <Pagination {...pagination} />
          <Button type="button" size="lg" onClick={() => onOpenChange(false)} className="ml-auto">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
