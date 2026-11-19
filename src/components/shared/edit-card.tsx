"use client";

import { useState } from "react";
import { AlertCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

/** One Overview section: values when read, its own form when editing; `onEdit` resets the draft, `readOnly` hides Edit. */
export function EditCard({
  title,
  description,
  view,
  form,
  onEdit,
  onSave,
  pending,
  error,
  canSave = true,
  readOnly = false,
}: {
  title: string;
  description?: string;
  view: React.ReactNode;
  form: React.ReactNode;
  onEdit: () => void;
  /** Resolves true when saved, so the card can close. */
  onSave: () => Promise<boolean>;
  pending?: boolean;
  /** A failure not tied to one field. */
  error?: string | null;
  /** False while the draft is incomplete; a field's hint should say what is missing. */
  canSave?: boolean;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <section className="rounded-(--shape-md) surface">
      <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {!editing && !readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onEdit();
              setEditing(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </header>

      {editing ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (pending || !canSave) return;
            if (await onSave()) setEditing(false);
          }}
        >
          <div className="space-y-4 px-5 py-4">
            {form}
            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-(--shape-sm) bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !canSave}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="px-5 py-4">{view}</div>
      )}
    </section>
  );
}

/** A label/value pair inside a card's read view. */
export function ViewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-2 first:pt-0 last:pb-0 sm:grid-cols-[160px_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm break-words text-foreground">{children}</dd>
    </div>
  );
}

/** What a read view shows for a field nobody has filled in. */
export function Empty({ children = "Not set" }: { children?: React.ReactNode }) {
  return <span className="text-sm text-muted-foreground">{children}</span>;
}
