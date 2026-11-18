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
export function countColumn<T>(key: string, header: string, value: (row: T) => number): Column<T> {
  return {
    key,
    header,
    align: "right",
    secondary: true,
    width: "110px",
    cell: (row) => <span className="text-sm text-muted-foreground">{value(row).toLocaleString("en-US")}</span>,
  };
}

/** The edit/delete column that ends every curriculum table. */
export function actionsColumn<T extends { name: string }>(
  onEdit: (row: T) => void,
  onDelete: (row: T) => void,
): Column<T> {
  return {
    key: "actions",
    header: "",
    align: "right",
    width: "110px",
    cell: (row) => (
      <div className="flex justify-end">
        <RowActions
          actions={[
            { icon: <Pencil className="h-4 w-4" />, label: `Edit ${row.name}`, onClick: () => onEdit(row) },
            {
              icon: <Trash2 className="h-4 w-4" />,
              label: `Delete ${row.name}`,
              onClick: () => onDelete(row),
              destructive: true,
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
