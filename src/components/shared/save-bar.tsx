"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * The save bar of a full-page form, pinned under the app header where it covers nothing. It says what still
 * blocks a save (or that the form is ready), and Cancel asks before discarding unsaved work.
 * Place it first inside the `<form>`; its Save button is the form's submit.
 */
export function SaveBar({
  problem,
  ready,
  dirty,
  pending,
  submitLabel,
  cancelHref,
}: {
  /** Why the form cannot be saved yet, e.g. "Pick a subject"; `null` when it can. */
  problem: string | null;
  /** Shown when there is no problem, e.g. "Ready to save" or "No changes yet". */
  ready: string;
  dirty: boolean;
  pending: boolean;
  submitLabel: string;
  cancelHref: string;
}) {
  const router = useRouter();
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  return (
    // Bleeds to the edges of the page's padding, so it reads as part of the header rather than a floating card.
    <div className="sticky top-18 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {confirmingLeave ? (
        <div
          role="alertdialog"
          aria-label="Discard changes?"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-foreground">Discard your unsaved changes?</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="lg" onClick={() => setConfirmingLeave(false)} autoFocus>
              Keep editing
            </Button>
            <Button type="button" variant="destructive" size="lg" onClick={() => router.push(cancelHref)}>
              Discard
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 text-sm",
              problem ? "text-muted-foreground" : "text-success",
            )}
          >
            {problem ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span className="truncate">{problem ?? ready}</span>
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={pending}
              onClick={() => (dirty ? setConfirmingLeave(true) : router.push(cancelHref))}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={pending || Boolean(problem)} title="Save (⌘/Ctrl + Enter)">
              {pending ? "Saving…" : submitLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
