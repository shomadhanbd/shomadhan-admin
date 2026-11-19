"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Tags } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/api-error";
import { useSubjects } from "@/lib/lookups";
import { TOPICS, chaptersApi, curriculumKeys, topicsApi } from "@/features/curriculum/api";
import { useCrudList } from "@/hooks/use-crud-list";
import { useUrlState } from "@/hooks/use-url-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, Field, ListToolbar, PageHeader, SearchInput } from "@/components/shared/page-shell";
import { NameCell, SlugInput, actionsColumn } from "./shared";
import type { Topic } from "@/features/curriculum/types";

const keys = curriculumKeys.topics;

function TopicDialog({
  topic,
  defaultSubject,
  onOpenChange,
}: {
  topic: Topic | null;
  /** The subject the list is filtered to, so a new topic starts in it. */
  defaultSubject: string;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(topic);
  const subjects = useSubjects();

  const [name, setName] = useState(topic?.name ?? "");
  const [slug, setSlug] = useState(topic?.slug ?? "");
  const [subject, setSubject] = useState(defaultSubject);
  const [chapter, setChapter] = useState(topic ? String(topic.chapter) : "");
  const [error, setError] = useState<string | null>(null);

  // Chapters are too many to load at once, so they are fetched for the chosen subject only.
  const chapters = useQuery({
    queryKey: [...curriculumKeys.chapters.lookup, subject],
    queryFn: () => chaptersApi.bySubject(Number(subject)),
    enabled: !isEdit && Boolean(subject),
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), slug: slug.trim(), chapter: Number(chapter) };
      return isEdit ? topicsApi.update(topic!.id, payload) : topicsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      toast.success(isEdit ? "Topic updated" : "Topic added");
      onOpenChange(false);
    },
    onError: (err) => setError(apiError(err)),
  });

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      size="sm"
      title={isEdit ? "Edit topic" : "New topic"}
      description={isEdit ? topic!.name : "A topic of one chapter."}
      submitLabel={isEdit ? "Save changes" : "Add topic"}
      pending={save.isPending}
      canSubmit={name.trim().length > 0 && Boolean(chapter)}
      error={error}
      onSubmit={() => {
        setError(null);
        save.mutate();
      }}
    >
      {isEdit ? (
        <Field id="topic-chapter" label="Chapter" hint="A topic stays in the chapter it was created in.">
          <Input id="topic-chapter" value={topic!.chapter_name} disabled />
        </Field>
      ) : (
        <>
          <Field id="topic-subject" label="Subject" required>
            <LookupSelect
              id="topic-subject"
              value={subject}
              onChange={(v) => {
                setSubject(v);
                // The chosen chapter belongs to the previous subject.
                setChapter("");
              }}
              options={subjects.data}
              placeholder="Pick a subject"
              className="w-full"
            />
          </Field>

          <Field id="topic-chapter" label="Chapter" required>
            <LookupSelect
              id="topic-chapter"
              value={chapter}
              onChange={setChapter}
              options={chapters.data}
              placeholder={subject ? "Pick a chapter" : "Pick a subject first"}
              disabled={!subject}
              className="w-full"
            />
          </Field>
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="topic-name" label="Name" required>
          <Input
            id="topic-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Newton's laws"
            autoFocus={isEdit}
          />
        </Field>
        <SlugInput id="topic-slug" value={slug} onChange={setSlug} />
      </div>
    </FormDialog>
  );
}

export function TopicsPage() {
  const subjects = useSubjects();
  const [subject, setSubject] = useUrlState("subject");
  const [editing, setEditing] = useState<Topic | null | "new">(null);

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
  } = useCrudList<Topic>({
    key: keys.all[0],
    path: TOPICS,
    params: { chapter__subject: subject },
    onDeleted: () => toast.success("Topic deleted"),
  });

  const columns: Column<Topic>[] = [
    { key: "name", header: "Topic", cell: (t) => <NameCell name={t.name} /> },
    {
      key: "chapter",
      header: "Chapter",
      width: "300px",
      cell: (t) => (
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm text-foreground">
            <span className="text-muted-foreground">{t.chapter_number}.</span> {t.chapter_name}
          </p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{t.subject_name}</p>
        </div>
      ),
    },
    actionsColumn<Topic>(setEditing, setDeleting),
  ];

  const filtered = Boolean(search || subject);
  function clearFilters() {
    onSearch("");
    setSubject("");
  }
  const newButton = (size?: "lg") => (
    <Button size={size} onClick={() => setEditing("new")}>
      <Plus className="h-4 w-4" />
      New topic
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Topics" description="The topics within each chapter">
        {newButton("lg")}
      </PageHeader>

      <ListToolbar total={isLoading ? undefined : total} noun="topics" filtered={filtered} onClear={clearFilters}>
        <SearchInput value={search} onChange={onSearch} placeholder="Search topics…" />
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
      </ListToolbar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        sort={sort}
        onSort={onSort}
        onRowClick={setEditing}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          filtered ? (
            <EmptyState
              icon={<Tags className="h-5 w-5" />}
              title="No topics match these filters"
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              firstRun
              title="No topics yet"
              description="A topic is the finest division of a chapter. Questions can be tagged with one or more."
              action={newButton()}
            />
          )
        }
      />

      <Pagination {...pagination} />

      {editing !== null && (
        <TopicDialog
          key={editing === "new" ? "new" : editing.id}
          topic={editing === "new" ? null : editing}
          defaultSubject={subject}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this topic?"
        description={
          <>
            <span className="font-medium text-foreground">{deleting?.name}</span> will be removed, and questions tagged
            with it will lose the tag.
          </>
        }
        confirmLabel="Delete topic"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}
