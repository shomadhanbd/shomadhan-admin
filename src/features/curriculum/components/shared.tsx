"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/page-shell";
import { RowActions } from "@/components/shared/row-actions";
import type { Column } from "@/components/shared/data-table";

/** The identity cell every curriculum table starts with: the name. */
export function NameCell({ name }: { name: string }) {
  // The slug is left to the edit form: the backend's slugify drops Bengali vowel signs, so a
  // slug under the name read as a garbled copy of it.
  return <p className="min-w-0 truncate font-medium text-foreground">{name}</p>;
}

/** A right-aligned count column. */
export function countColumn<T>(
  key: string,
  header: string,
  value: (row: T) => number,
  /** The API's ordering field, when the column should sort (largest first). */
  sortKey?: string,
): Column<T> {
  return {
    key,
    header,
    align: "right",
    secondary: true,
    width: "110px",
    sortKey,
    sortFirst: "desc",
    cell: (row) => <span className="text-sm text-muted-foreground">{value(row).toLocaleString("en-US")}</span>,
  };
}

/** A level, group or batch can't be deleted while students are placed in it (the backend refuses too). */
export const hasStudents = (row: { student_count: number }) =>
  row.student_count ? `${row.student_count} ${row.student_count === 1 ? "student is" : "students are"} in it` : null;

/** The actions menu that ends every curriculum table: edit, then delete. */
export function actionsColumn<T extends { name: string }>(
  onEdit: (row: T) => void,
  onDelete: (row: T) => void,
  /** Why a row can't be deleted, if it can't; the delete button then explains instead of asking. */
  deleteBlockedBy?: (row: T) => string | null,
): Column<T> {
  return {
    key: "actions",
    header: "",
    align: "right",
    width: "56px",
    cell: (row) => (
      <div className="flex justify-end">
        <RowActions
          name={row.name}
          actions={[
            { icon: <Pencil className="h-4 w-4" />, label: "Edit", onClick: () => onEdit(row) },
            {
              icon: <Trash2 className="h-4 w-4" />,
              label: "Delete",
              onClick: () => onDelete(row),
              destructive: true,
              blockedBy: deleteBlockedBy?.(row),
            },
          ]}
        />
      </div>
    ),
  };
}

/** The slug input shared by every curriculum form; the backend fills a blank one from the name. */
export function SlugInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field id={id} label="Slug" hint="The name used in links. Leave blank to create it from the name.">
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}
