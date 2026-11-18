"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers, Plus } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/api-error";
import { useEducationLevels } from "@/lib/lookups";
import { ACADEMIC_GROUPS, academicGroupsApi, curriculumKeys } from "@/features/curriculum/api";
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
import type { AcademicGroup } from "@/features/curriculum/types";

const keys = curriculumKeys.academicGroups;

function AcademicGroupDialog({
  group,
  onOpenChange,
}: {
  group: AcademicGroup | null;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(group);
  const levels = useEducationLevels();

  const [name, setName] = useState(group?.name ?? "");
  const [slug, setSlug] = useState(group?.slug ?? "");
  const [level, setLevel] = useState(group ? String(group.education_level) : "");
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), slug: slug.trim(), education_level: Number(level) };
      return isEdit ? academicGroupsApi.update(group!.id, payload) : academicGroupsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      queryClient.invalidateQueries({ queryKey: keys.lookup });
      // A new or removed group changes its level's group count.
      queryClient.invalidateQueries({ queryKey: curriculumKeys.educationLevels.all });
      toast.success(isEdit ? "Group updated" : "Group added");
      onOpenChange(false);
    },
    onError: (err) => setError(apiError(err)),
  });

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      size="sm"
      title={isEdit ? "Edit academic group" : "New academic group"}
      description={isEdit ? group!.name : "A stream within one level, e.g. Science."}
      submitLabel={isEdit ? "Save changes" : "Add group"}
      pending={save.isPending}
      canSubmit={name.trim().length > 0 && Boolean(level)}
      error={error}
      onSubmit={() => {
        setError(null);
        save.mutate();
      }}
    >
      <Field id="group-name" label="Name" required>
        <Input
          id="group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Science"
          autoFocus
        />
      </Field>

      <Field
        id="group-level"
        label="Education level"
        required
        hint={isEdit ? "A group stays in the level it was created in." : undefined}
      >
        <LookupSelect
          id="group-level"
          value={level}
          onChange={setLevel}
          options={levels.data}
          placeholder="Pick a level"
          disabled={isEdit}
          className="w-full"
        />
      </Field>

      <SlugInput id="group-slug" value={slug} onChange={setSlug} />
    </FormDialog>
  );
}

export function AcademicGroupsPage() {
  const queryClient = useQueryClient();
  const levels = useEducationLevels();
  const [level, setLevel] = useUrlState("level");
  const [editing, setEditing] = useState<AcademicGroup | null | "new">(null);

  const { rows, isLoading, isFetching, search, onSearch, setPage, deleting, setDeleting, remove, pagination } =
    useCrudList<AcademicGroup>({
      key: keys.all[0],
      path: ACADEMIC_GROUPS,
      params: { education_level: level },
      onDeleted: () => {
        queryClient.invalidateQueries({ queryKey: keys.lookup });
        queryClient.invalidateQueries({ queryKey: curriculumKeys.educationLevels.all });
        toast.success("Group deleted");
      },
    });

  const columns: Column<AcademicGroup>[] = [
    { key: "name", header: "Group", cell: (g) => <NameCell name={g.name} slug={g.slug} /> },
    {
      key: "level",
      header: "Level",
      width: "180px",
      cell: (g) => <span className="text-sm text-foreground">{g.education_level_name}</span>,
    },
    countColumn("subjects", "Subjects", (g) => g.subject_count),
    countColumn("questions", "Questions", (g) => g.question_count),
    actionsColumn<AcademicGroup>(setEditing, setDeleting),
  ];

  const filtered = Boolean(search || level);
  const newButton = (size?: "lg") => (
    <Button size={size} onClick={() => setEditing("new")}>
      <Plus className="h-4 w-4" />
      New group
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Academic groups" description="The streams within each education level">
        <SearchInput value={search} onChange={onSearch} placeholder="Search groups…" />
        <LookupSelect
          ariaLabel="Filter by education level"
          value={level}
          onChange={(v) => {
            setLevel(v);
            setPage(1);
          }}
          options={levels.data}
          placeholder="All levels"
          allLabel="All levels"
          className="w-36"
        />
        {newButton("lg")}
      </PageHeader>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(g) => g.id}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          filtered ? (
            <EmptyState
              icon={<Layers className="h-5 w-5" />}
              title="No groups match these filters"
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    onSearch("");
                    setLevel("");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              firstRun
              title="No academic groups yet"
              description="A group is a stream such as Science, Arts or Commerce. Each one belongs to an education level."
              action={newButton()}
            />
          )
        }
      />

      <Pagination {...pagination} />

      {editing !== null && (
        <AcademicGroupDialog
          key={editing === "new" ? "new" : editing.id}
          group={editing === "new" ? null : editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this group?"
        description={
          <>
            <span className="font-medium text-foreground">{deleting?.name}</span> will be removed. A group that still
            has subjects cannot be deleted.
          </>
        }
        confirmLabel="Delete group"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}
