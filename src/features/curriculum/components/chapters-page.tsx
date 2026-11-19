"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Crown, LockOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/api-error";
import { useSubjects } from "@/lib/lookups";
import { CHAPTERS, chaptersApi, curriculumKeys, subjectsApi } from "@/features/curriculum/api";
import { useCrudList } from "@/hooks/use-crud-list";
import { useUrlState } from "@/hooks/use-url-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, Field, ListToolbar, PageHeader, SearchInput } from "@/components/shared/page-shell";
import { NameCell, SlugInput, actionsColumn, countColumn } from "./shared";
import { useSetChapterAccess, useSetChapterLock } from "@/features/curriculum/hooks/use-chapter-access";
import type { Chapter } from "@/features/curriculum/types";

const CHAPTER_ACCESS = [
  { id: "true", name: "VIP only" },
  { id: "false", name: "Free" },
];

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
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
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
        <Field id="chapter-number" label="Chapter number" hint="Sets the order.">
          <Input
            id="chapter-number"
            type="number"
            min={0}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="e.g. 1"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="chapter-name" label="Name" required>
          <Input
            id="chapter-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Motion"
            autoFocus
          />
        </Field>
        <SlugInput id="chapter-slug" value={slug} onChange={setSlug} />
      </div>

      <Field id="chapter-locked" label="VIP only" hint="Free students see it with a lock and are asked to upgrade.">
        <Switch id="chapter-locked" checked={isLocked} onCheckedChange={setIsLocked} />
      </Field>
    </FormDialog>
  );
}

/** The subject the list is filtered to: how many of its chapters are VIP, and a switch for all of them. */
function SubjectChaptersPanel({ id }: { id: number }) {
  const subject = useQuery({
    queryKey: [...curriculumKeys.subjects.all, "detail", id],
    queryFn: () => subjectsApi.get(id),
  });
  const setChapterAccess = useSetChapterAccess();
  const [bulk, setBulk] = useState<boolean | null>(null);

  const s = subject.data;
  // A subject id from an old link that no longer exists: the list's own empty state explains it.
  if (subject.isError) return null;
  if (!s) return <div className="h-[92px] animate-pulse surface" aria-hidden />;

  return (
    <section aria-label={`${s.name} VIP access`} className="flex flex-wrap items-center gap-x-8 gap-y-4 surface p-4">
      <div className="min-w-0 flex-1 basis-60">
        <p className="font-semibold text-foreground">{s.name}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {s.chapter_count === 0
            ? "No chapters yet."
            : `${s.locked_chapter_count} of ${s.chapter_count} chapters are VIP only.`}
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Every chapter</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={s.chapter_count === 0 || s.locked_chapter_count === s.chapter_count}
            onClick={() => setBulk(true)}
          >
            <Crown className="h-3.5 w-3.5 text-warning" />
            Make all VIP
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={s.chapter_count === 0 || s.locked_chapter_count === 0}
            onClick={() => setBulk(false)}
          >
            <LockOpen className="h-3.5 w-3.5 text-success" />
            Make all free
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={bulk !== null}
        onOpenChange={(o) => !o && setBulk(null)}
        tone="default"
        title={bulk ? "Make every chapter VIP only?" : "Make every chapter free?"}
        description={
          <>
            All {s.chapter_count} chapters of <span className="font-medium text-foreground">{s.name}</span> will be{" "}
            {bulk ? "locked for free students" : "open to every student"}.
          </>
        }
        confirmLabel={bulk ? "Make all VIP" : "Make all free"}
        pending={setChapterAccess.isPending}
        onConfirm={() =>
          bulk !== null && setChapterAccess.mutate({ id: s.id, value: bulk }, { onSuccess: () => setBulk(null) })
        }
      />
    </section>
  );
}

export function ChaptersPage() {
  const queryClient = useQueryClient();
  const subjects = useSubjects();
  const [subject, setSubject] = useUrlState("subject");
  const [access, setAccess] = useUrlState("access");
  const [editing, setEditing] = useState<Chapter | null | "new">(null);
  const setLock = useSetChapterLock();

  const {
    rows,
    isLoading,
    isFetching,
    search,
    onSearch,
    setPage,
    deleting,
    setDeleting,
    remove,
    pagination,
    total,
    sort,
    onSort,
  } = useCrudList<Chapter>({
    key: keys.all[0],
    path: CHAPTERS,
    params: { subject, is_locked: access },
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
      sortKey: "chapter_number",
      width: "70px",
      cell: (c) => <span className="text-sm text-muted-foreground">{c.chapter_number}</span>,
    },
    { key: "name", header: "Chapter", cell: (c) => <NameCell name={c.name} /> },
    ...(subject
      ? []
      : [
          {
            key: "subject",
            header: "Subject",
            secondary: true,
            width: "200px",
            cell: (c) => <span className="text-sm text-foreground">{c.subject_name}</span>,
          } satisfies Column<Chapter>,
        ]),
    countColumn("questions", "Questions", (c) => c.question_count, "question_count"),
    {
      key: "is_locked",
      header: "VIP only",
      width: "170px",
      sortKey: "is_locked",
      sortFirst: "desc",
      cell: (c) => (
        <div className="flex items-center gap-2">
          <Switch
            aria-label={`${c.name} is VIP only`}
            checked={c.is_locked}
            disabled={setLock.isPending && setLock.variables?.id === c.id}
            onCheckedChange={(value) => setLock.mutate({ id: c.id, name: c.name, value })}
          />
          <span className={c.is_locked ? "text-xs font-medium text-warning" : "text-xs text-muted-foreground"}>
            {c.is_locked ? "VIP" : "Free"}
          </span>
        </div>
      ),
    },
    actionsColumn<Chapter>(setEditing, setDeleting),
  ];

  const filtered = Boolean(search || subject || access);
  function clearFilters() {
    onSearch("");
    setSubject("");
    setAccess("");
  }
  const newButton = (size?: "lg") => (
    <Button size={size} onClick={() => setEditing("new")}>
      <Plus className="h-4 w-4" />
      New chapter
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Chapters" description="The chapters of each subject, and which of them need VIP">
        {newButton("lg")}
      </PageHeader>

      <ListToolbar total={isLoading ? undefined : total} noun="chapters" filtered={filtered} onClear={clearFilters}>
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
        <LookupSelect
          ariaLabel="Filter by VIP access"
          value={access}
          onChange={(v) => {
            setAccess(v);
            setPage(1);
          }}
          options={CHAPTER_ACCESS}
          placeholder="Any access"
          allLabel="Any access"
          className="w-36"
        />
      </ListToolbar>

      {subject ? (
        <SubjectChaptersPanel id={Number(subject)} />
      ) : (
        <p className="text-sm text-muted-foreground">Pick a subject to lock or free all its chapters at once.</p>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        sort={sort}
        onSort={onSort}
        onRowClick={setEditing}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          filtered ? (
            <EmptyState
              icon={<BookMarked className="h-5 w-5" />}
              title="No chapters match these filters"
              action={
                <Button variant="outline" onClick={clearFilters}>
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
