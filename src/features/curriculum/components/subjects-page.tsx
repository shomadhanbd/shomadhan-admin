"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/api-error";
import { useAcademicGroups, useEducationLevels } from "@/lib/lookups";
import { SUBJECTS, curriculumKeys, subjectsApi } from "@/features/curriculum/api";
import { useCrudList } from "@/hooks/use-crud-list";
import { useUrlState } from "@/hooks/use-url-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, Field, PageHeader, SearchInput } from "@/components/shared/page-shell";
import { NameCell, SlugInput, actionsColumn, countColumn } from "./shared";
import type { Subject } from "@/features/curriculum/types";

const keys = curriculumKeys.subjects;

/** The groups of one level; every group while no level is chosen. */
function useGroupsOf(level: string) {
  const groups = useAcademicGroups();
  return useMemo(
    () => (level ? groups.data?.filter((g) => String(g.education_level) === level) : groups.data),
    [groups.data, level],
  );
}

function SubjectDialog({ subject, onOpenChange }: { subject: Subject | null; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(subject);
  const levels = useEducationLevels();

  const [name, setName] = useState(subject?.name ?? "");
  const [slug, setSlug] = useState(subject?.slug ?? "");
  const [level, setLevel] = useState(subject ? String(subject.education_level) : "");
  const [group, setGroup] = useState(subject ? String(subject.academic_group) : "");
  const [error, setError] = useState<string | null>(null);
  const groups = useGroupsOf(level);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        education_level: Number(level),
        academic_group: Number(group),
      };
      return isEdit ? subjectsApi.update(subject!.id, payload) : subjectsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      queryClient.invalidateQueries({ queryKey: keys.lookup });
      // A subject added, removed or moved changes its group's and level's counts.
      queryClient.invalidateQueries({ queryKey: curriculumKeys.academicGroups.all });
      queryClient.invalidateQueries({ queryKey: curriculumKeys.educationLevels.all });
      toast.success(isEdit ? "Subject updated" : "Subject added");
      onOpenChange(false);
    },
    onError: (err) => setError(apiError(err)),
  });

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      size="sm"
      title={isEdit ? "Edit subject" : "New subject"}
      description={isEdit ? subject!.name : "A subject of one level and group, e.g. Physics."}
      submitLabel={isEdit ? "Save changes" : "Add subject"}
      pending={save.isPending}
      canSubmit={name.trim().length > 0 && Boolean(level) && Boolean(group)}
      error={error}
      onSubmit={() => {
        setError(null);
        save.mutate();
      }}
    >
      <Field id="subject-name" label="Name" required>
        <Input
          id="subject-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Physics"
          autoFocus
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="subject-level" label="Education level" required>
          <LookupSelect
            id="subject-level"
            value={level}
            onChange={(v) => {
              setLevel(v);
              // The chosen group belongs to the previous level.
              setGroup("");
            }}
            options={levels.data}
            placeholder="Pick a level"
            className="w-full"
          />
        </Field>

        <Field id="subject-group" label="Academic group" required>
          <LookupSelect
            id="subject-group"
            value={group}
            onChange={setGroup}
            options={groups}
            placeholder={level ? "Pick a group" : "Pick a level first"}
            disabled={!level}
            className="w-full"
          />
        </Field>
      </div>

      <SlugInput id="subject-slug" value={slug} onChange={setSlug} />
    </FormDialog>
  );
}

export function SubjectsPage() {
  const queryClient = useQueryClient();
  const levels = useEducationLevels();
  const [level, setLevel] = useUrlState("level");
  const [group, setGroup] = useUrlState("group");
  const [editing, setEditing] = useState<Subject | null | "new">(null);
  const groups = useGroupsOf(level);

  const { rows, isLoading, isFetching, search, onSearch, setPage, deleting, setDeleting, remove, pagination } =
    useCrudList<Subject>({
      key: keys.all[0],
      path: SUBJECTS,
      params: { education_level: level, academic_group: group },
      onDeleted: () => {
        queryClient.invalidateQueries({ queryKey: keys.lookup });
        queryClient.invalidateQueries({ queryKey: curriculumKeys.academicGroups.all });
        queryClient.invalidateQueries({ queryKey: curriculumKeys.educationLevels.all });
        toast.success("Subject deleted");
      },
    });

  const columns: Column<Subject>[] = [
    { key: "name", header: "Subject", cell: (s) => <NameCell name={s.name} slug={s.slug} /> },
    {
      key: "level",
      header: "Level",
      width: "140px",
      cell: (s) => <span className="text-sm text-foreground">{s.education_level_name}</span>,
    },
    {
      key: "group",
      header: "Group",
      secondary: true,
      width: "140px",
      cell: (s) => <span className="text-sm text-foreground">{s.academic_group_name}</span>,
    },
    countColumn("chapters", "Chapters", (s) => s.chapter_count),
    countColumn("questions", "Questions", (s) => s.question_count),
    actionsColumn<Subject>(setEditing, setDeleting),
  ];

  const filtered = Boolean(search || level || group);
  const newButton = (size?: "lg") => (
    <Button size={size} onClick={() => setEditing("new")}>
      <Plus className="h-4 w-4" />
      New subject
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Subjects" description="The subjects of each level and group">
        <SearchInput value={search} onChange={onSearch} placeholder="Search subjects…" />
        <LookupSelect
          ariaLabel="Filter by education level"
          value={level}
          onChange={(v) => {
            setLevel(v);
            setGroup("");
            setPage(1);
          }}
          options={levels.data}
          placeholder="All levels"
          allLabel="All levels"
          className="w-36"
        />
        <LookupSelect
          ariaLabel="Filter by academic group"
          value={group}
          onChange={(v) => {
            setGroup(v);
            setPage(1);
          }}
          options={groups}
          placeholder="All groups"
          allLabel="All groups"
          className="w-36"
        />
        {newButton("lg")}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(s) => s.id}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          filtered ? (
            <EmptyState
              icon={<BookOpen className="h-5 w-5" />}
              title="No subjects match these filters"
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    onSearch("");
                    setLevel("");
                    setGroup("");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              firstRun
              title="No subjects yet"
              description="A subject belongs to one level and group. Chapters, topics and questions sit under it."
              action={newButton()}
            />
          )
        }
      />

      <Pagination {...pagination} />

      {editing !== null && (
        <SubjectDialog
          key={editing === "new" ? "new" : editing.id}
          subject={editing === "new" ? null : editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this subject?"
        description={
          <>
            <span className="font-medium text-foreground">{deleting?.name}</span> will be removed. A subject that still
            has chapters or questions cannot be deleted.
          </>
        }
        confirmLabel="Delete subject"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}
