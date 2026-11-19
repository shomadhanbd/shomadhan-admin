"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Right-side panel for long forms: `summary` previews the result, `dirty` confirms before closing, ⌘/Ctrl+Enter saves. */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Save",
  pending,
  canSubmit = true,
  error,
  summary,
  dirty = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  pending?: boolean;
  canSubmit?: boolean;
  error?: string | null;
  summary?: React.ReactNode;
  dirty?: boolean;
}) {
  const [confirmingClose, setConfirmingClose] = useState(false);

  function requestClose() {
    if (pending) return;
    if (dirty) setConfirmingClose(true);
    else onOpenChange(false);
  }

  function submit() {
    if (!pending && canSubmit) onSubmit();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else requestClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl lg:data-[side=right]:max-w-2xl"
      >
        <header className="shrink-0 border-b border-border px-6 py-4 pr-14">
          <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
          {description && <SheetDescription className="mt-0.5 truncate">{description}</SheetDescription>}
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-5">
            {children}
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

          <footer className="shrink-0 border-t border-border bg-surface-1 px-6 py-3">
            {confirmingClose ? (
              <div
                role="alertdialog"
                aria-label="Discard changes?"
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <p className="text-sm text-foreground">Discard your unsaved changes?</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="lg" onClick={() => setConfirmingClose(false)} autoFocus>
                    Keep editing
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="lg"
                    onClick={() => {
                      setConfirmingClose(false);
                      onOpenChange(false);
                    }}
                  >
                    Discard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1 text-sm text-muted-foreground">{summary}</div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="lg" onClick={requestClose} disabled={pending}>
                    Cancel
                  </Button>
                  <Button type="submit" size="lg" disabled={pending || !canSubmit} title="Save (⌘/Ctrl + Enter)">
                    {pending ? "Saving…" : submitLabel}
                  </Button>
                </div>
              </div>
            )}
          </footer>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/** A titled group of fields inside a `FormSheet`. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
