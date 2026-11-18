"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Plus } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/api-error";
import { useSubjects } from "@/lib/lookups";
import { CHAPTERS, chaptersApi, curriculumKeys } from "@/features/curriculum/api";
import { useCrudList } from "@/hooks/use-crud-list";
import { useUrlState } from "@/hooks/use-url-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, Field, PageHeader, SearchInput } from "@/components/shared/page-shell";
import { NameCell, SlugInput, actionsColumn, countColumn } from "./shared";
import type { Chapter } from "@/features/curriculum/types";

const keys = curriculumKeys.chapters;

function ChapterDialog({
  chapter,
  defaultSubject,
  onOpenChange,
}: {
  chapter: Chapter | null;
  /** The subject the list is filtered to, so a new chapter starts in it. */
  defaultSubject: string;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(chapter);
  const subjects = useSubjects();

  const [name, setName] = useState(chapter?.name ?? "");
  const [slug, setSlug] = useState(chapter?.slug ?? "");
  const [subject, setSubject] = useState(chapter ? String(chapter.subject) : defaultSubject);
  const [number, setNumber] = useState(chapter ? String(chapter.chapter_number) : "");
  const [isLocked, setIsLocked] = useState(chapter?.is_locked ?? false);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        subject: Number(subject),
        chapter_number: Number(number) || 0,
        is_locked: isLocked,
      };
      return isEdit ? chaptersApi.update(chapter!.id, payload) : chaptersApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      queryClient.invalidateQueries({ queryKey: keys.lookup });
      // A new chapter changes the chapter count shown on its subject, group and level.
      queryClient.invalidateQueries({ queryKey: curriculumKeys.subjects.all });
      queryClient.invalidateQueries({ queryKey: curriculumKeys.academicGroups.all });
      queryClient.invalidateQueries({ queryKey: curriculumKeys.educationLevels.all });
      toast.success(isEdit ? "Chapter updated" : "Chapter added");
      onOpenChange(false);
    },
    onError: (err) => setError(apiError(err)),
  });

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      size="sm"
      title={isEdit ? "Edit chapter" : "New chapter"}
      description={isEdit ? chapter!.name : "A chapter of one subject."}
      submitLabel={isEdit ? "Save changes" : "Add chapter"}
      pending={save.isPending}
      canSubmit={name.trim().length > 0 && Boolean(subject)}
      error={error}
      onSubmit={() => {
        setError(null);
        save.mutate();
      }}
    >
      <Field
        id="chapter-subject"
        label="Subject"
        required
        hint={isEdit ? "A chapter stays in the subject it was created in." : undefined}
      >
        <LookupSelect
          id="chapter-subject"
          value={subject}
          onChange={setSubject}
          options={subjects.data}
          placeholder="Pick a subject"
          disabled={isEdit}
          className="w-full"
        />
      </Field>

      <Field id="chapter-name" label="Name" required>
        <Input
          id="chapter-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Motion"
          autoFocus
        />
      </Field>

      <Field id="chapter-number" label="Chapter number" hint="Chapters are listed in this order.">
        <Input
          id="chapter-number"
          type="number"
          min={0}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="e.g. 1"
          className="w-28"
        />
      </Field>

      <SlugInput id="chapter-slug" value={slug} onChange={setSlug} />

      <Field id="chapter-locked" label="Locked" hint="A locked chapter shows a lock badge in the app.">
        <Switch id="chapter-locked" checked={isLocked} onCheckedChange={setIsLocked} />
      </Field>
    </FormDialog>
  );
}

export function ChaptersPage() {
  const queryClient = useQueryClient();
  const subjects = useSubjects();
  const [subject, setSubject] = useUrlState("subject");
  const [editing, setEditing] = useState<Chapter | null | "new">(null);

  const { rows, isLoading, isFetching, search, onSearch, setPage, deleting, setDeleting, remove, pagination } =
    useCrudList<Chapter>({
      key: keys.all[0],
      path: CHAPTERS,
      params: { subject },
      onDeleted: () => {
        queryClient.invalidateQueries({ queryKey: keys.lookup });
        queryClient.invalidateQueries({ queryKey: curriculumKeys.subjects.all });
        queryClient.invalidateQueries({ queryKey: curriculumKeys.academicGroups.all });
        queryClient.invalidateQueries({ queryKey: curriculumKeys.educationLevels.all });
        toast.success("Chapter deleted");
      },
    });

  const columns: Column<Chapter>[] = [
    {
      key: "number",
      header: "No.",
      align: "right",
      width: "70px",
      cell: (c) => <span className="text-sm text-muted-foreground">{c.chapter_number}</span>,
    },
    { key: "name", header: "Chapter", cell: (c) => <NameCell name={c.name} slug={c.slug} /> },
    {
      key: "subject",
      header: "Subject",
      secondary: true,
      width: "200px",
      cell: (c) => <span className="text-sm text-foreground">{c.subject_name}</span>,
    },
    countColumn("questions", "Questions", (c) => c.question_count),
    {
      key: "is_locked",
      header: "Access",
      secondary: true,
      width: "110px",
      cell: (c) => (c.is_locked ? <Badge variant="outline">Locked</Badge> : <Badge variant="secondary">Open</Badge>),
    },
    actionsColumn<Chapter>(setEditing, setDeleting),
  ];

  const filtered = Boolean(search || subject);
  const newButton = (size?: "lg") => (
    <Button size={size} onClick={() => setEditing("new")}>
      <Plus className="h-4 w-4" />
      New chapter
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Chapters" description="The chapters of each subject">
        <SearchInput value={search} onChange={onSearch} placeholder="Search chapters…" />
        <LookupSelect
          ariaLabel="Filter by subject"
          value={subject}
          onChange={(v) => {
            setSubject(v);
            setPage(1);
          }}
          options={subjects.data}
          placeholder="All subjects"
          allLabel="All subjects"
          className="w-44"
        />
        {newButton("lg")}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          filtered ? (
            <EmptyState
              icon={<BookMarked className="h-5 w-5" />}
              title="No chapters match these filters"
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    onSearch("");
                    setSubject("");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              firstRun
              title="No chapters yet"
              description="A chapter belongs to one subject. Topics and questions are filed under it."
              action={newButton()}
            />
          )
        }
      />

      <Pagination {...pagination} />

      {editing !== null && (
        <ChapterDialog
          key={editing === "new" ? "new" : editing.id}
          chapter={editing === "new" ? null : editing}
          defaultSubject={subject}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this chapter?"
        description={
          <>
            <span className="font-medium text-foreground">{deleting?.name}</span> will be removed. A chapter that still
            has topics or questions cannot be deleted.
          </>
        }
        confirmLabel="Delete chapter"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}
