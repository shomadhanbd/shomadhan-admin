"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users2 } from "lucide-react";
import { toast } from "sonner";
import { apiError } from "@/lib/api-error";
import { useEducationLevels } from "@/lib/lookups";
import { BATCHES, batchesApi, curriculumKeys } from "@/features/curriculum/api";
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
import { EmptyState, Field, ListToolbar, PageHeader, SearchInput } from "@/components/shared/page-shell";
import { NameCell, SlugInput, actionsColumn, countColumn, hasStudents } from "./shared";
import type { Batch } from "@/features/curriculum/types";

const keys = curriculumKeys.batches;

function BatchDialog({ batch, onOpenChange }: { batch: Batch | null; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(batch);
  const levels = useEducationLevels();

  const [name, setName] = useState(batch?.name ?? "");
  const [slug, setSlug] = useState(batch?.slug ?? "");
  const [level, setLevel] = useState(batch ? String(batch.education_level) : "");
  const [isActive, setIsActive] = useState(batch?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), slug: slug.trim(), education_level: Number(level), is_active: isActive };
      return isEdit ? batchesApi.update(batch!.id, payload) : batchesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      queryClient.invalidateQueries({ queryKey: keys.lookup });
      toast.success(isEdit ? "Batch updated" : "Batch added");
      onOpenChange(false);
    },
    onError: (err) => setError(apiError(err)),
  });

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      size="sm"
      title={isEdit ? "Edit batch" : "New batch"}
      description={isEdit ? batch!.name : "A cohort of one level, e.g. HSC 2026."}
      submitLabel={isEdit ? "Save changes" : "Add batch"}
      pending={save.isPending}
      canSubmit={name.trim().length > 0 && Boolean(level)}
      error={error}
      onSubmit={() => {
        setError(null);
        save.mutate();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="batch-name" label="Name" required>
          <Input
            id="batch-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. HSC 2026"
            autoFocus
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <SlugInput id="batch-slug" value={slug} onChange={setSlug} />
          <Field id="batch-active" label="Active" hint="Students can only pick an active batch.">
            <Switch id="batch-active" checked={isActive} onCheckedChange={setIsActive} />
          </Field>
        </div>
      </div>

      <Field id="batch-level" label="Education level" required>
        <LookupSelect
          id="batch-level"
          value={level}
          onChange={setLevel}
          options={levels.data}
          placeholder="Pick a level"
          className="w-full"
        />
      </Field>
    </FormDialog>
  );
}

export function BatchesPage() {
  const queryClient = useQueryClient();
  const levels = useEducationLevels();
  const [level, setLevel] = useUrlState("level");
  const [editing, setEditing] = useState<Batch | null | "new">(null);

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
  } = useCrudList<Batch>({
    key: keys.all[0],
    path: BATCHES,
    params: { education_level: level },
    onDeleted: () => {
      queryClient.invalidateQueries({ queryKey: keys.lookup });
      toast.success("Batch deleted");
    },
  });

  const columns: Column<Batch>[] = [
    { key: "name", header: "Batch", cell: (b) => <NameCell name={b.name} /> },
    {
      key: "level",
      header: "Level",
      width: "180px",
      cell: (b) => <span className="text-sm text-foreground">{b.education_level_name}</span>,
    },
    { ...countColumn("students", "Students", (b) => b.student_count, "student_count"), secondary: false },
    {
      key: "is_active",
      header: "Active",
      secondary: true,
      width: "110px",
      cell: (b) => (b.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Inactive</Badge>),
    },
    actionsColumn<Batch>(setEditing, setDeleting, hasStudents),
  ];

  const filtered = Boolean(search || level);
  function clearFilters() {
    onSearch("");
    setLevel("");
  }
  const newButton = (size?: "lg") => (
    <Button size={size} onClick={() => setEditing("new")}>
      <Plus className="h-4 w-4" />
      New batch
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Batches" description="Cohorts of students, one per level and year">
        {newButton("lg")}
      </PageHeader>

      <ListToolbar total={isLoading ? undefined : total} noun="batches" filtered={filtered} onClear={clearFilters}>
        <SearchInput value={search} onChange={onSearch} placeholder="Search batches…" />
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
      </ListToolbar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(b) => b.id}
        sort={sort}
        onSort={onSort}
        onRowClick={setEditing}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          filtered ? (
            <EmptyState
              icon={<Users2 className="h-5 w-5" />}
              title="No batches match these filters"
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              firstRun
              title="No batches yet"
              description="A batch groups the students of one level and year. Students choose theirs when they sign up."
              action={newButton()}
            />
          )
        }
      />

      <Pagination {...pagination} />

      {editing !== null && (
        <BatchDialog
          key={editing === "new" ? "new" : editing.id}
          batch={editing === "new" ? null : editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this batch?"
        description={
          <>
            <span className="font-medium text-foreground">{deleting?.name}</span> will be removed. Only a batch with no
            students in it can be deleted; to retire one in use, mark it inactive instead.
          </>
        }
        confirmLabel="Delete batch"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  );
}
