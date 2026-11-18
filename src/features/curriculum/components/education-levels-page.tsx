"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Plus } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/api-error";
import { EDUCATION_LEVELS, curriculumKeys, educationLevelsApi } from "@/features/curriculum/api";
import { useCrudList } from "@/hooks/use-crud-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { FormDialog } from "@/components/shared/form-dialog";
import { EmptyState, Field, PageHeader, SearchInput } from "@/components/shared/page-shell";
import { NameCell, SlugInput, actionsColumn, countColumn } from "./shared";
import type { EducationLevel } from "@/features/curriculum/types";

const keys = curriculumKeys.educationLevels;

function EducationLevelDialog({
  level,
  onOpenChange,
}: {
  level: EducationLevel | null;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(level);

  const [name, setName] = useState(level?.name ?? "");
  const [slug, setSlug] = useState(level?.slug ?? "");
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), slug: slug.trim() };
      return isEdit ? educationLevelsApi.update(level!.id, payload) : educationLevelsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      queryClient.invalidateQueries({ queryKey: keys.lookup });
      toast.success(isEdit ? "Education level updated" : "Education level added");
      onOpenChange(false);
    },
    onError: (err) => setError(apiError(err)),
  });

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      size="sm"
      title={isEdit ? "Edit education level" : "New education level"}
      description={isEdit ? level!.name : "The exam stage students prepare for, e.g. HSC."}
      submitLabel={isEdit ? "Save changes" : "Add level"}
      pending={save.isPending}
      canSubmit={name.trim().length > 0}
      error={error}
      onSubmit={() => {
        setError(null);
        save.mutate();
      }}
    >
      <Field id="level-name" label="Name" required>
        <Input
          id="level-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. HSC"
          autoFocus
        />
      </Field>
      <SlugInput id="level-slug" value={slug} onChange={setSlug} />
    </FormDialog>
  );
}

export function EducationLevelsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EducationLevel | null | "new">(null);

  const { rows, isLoading, isFetching, search, onSearch, deleting, setDeleting, remove, pagination } =
    useCrudList<EducationLevel>({
      key: keys.all[0],
      path: EDUCATION_LEVELS,
      onDeleted: () => {
        queryClient.invalidateQueries({ queryKey: keys.lookup });
        toast.success("Education level deleted");
      },
    });

  const columns: Column<EducationLevel>[] = [
    { key: "name", header: "Level", cell: (l) => <NameCell name={l.name} /> },
    countColumn("groups", "Groups", (l) => l.group_count),
    countColumn("subjects", "Subjects", (l) => l.subject_count),
    countColumn("chapters", "Chapters", (l) => l.chapter_count),
    countColumn("questions", "Questions", (l) => l.question_count),
    actionsColumn<EducationLevel>(setEditing, setDeleting),
  ];

  const newButton = (size?: "lg") => (
    <Button size={size} onClick={() => setEditing("new")}>
      <Plus className="h-4 w-4" />
      New level
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Education levels" description="The exam stages students prepare for">
        <SearchInput value={search} onChange={onSearch} placeholder="Search levels…" />
        {newButton("lg")}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(l) => l.id}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          search ? (
            <EmptyState
              icon={<GraduationCap className="h-5 w-5" />}
              title="No levels match this search"
              action={
                <Button variant="outline" onClick={() => onSearch("")}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState
              firstRun
              title="No education levels yet"
              description="A level is the exam a student prepares for, such as HSC or SSC. Groups and subjects sit under it."
              action={newButton()}
            />
          )
        }
      />

      <Pagination {...pagination} />

      {editing !== null && (
        <EducationLevelDialog
          key={editing === "new" ? "new" : editing.id}
          level={editing === "new" ? null : editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this education level?"
        description={
          <>
            <span className="font-medium text-foreground">{deleting?.name}</span> will be removed. A level that still
            has groups, batches or subjects cannot be deleted.
          </>
        }
        confirmLabel="Delete level"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}
