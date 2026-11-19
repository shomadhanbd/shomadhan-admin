"use client";

import { useEffect, useSyncExternalStore } from "react";

/*
 * Unsaved-changes guard. A form calls `useLeaveWarning(dirty)`; while any form is dirty:
 * - closing or reloading the tab asks the browser's own "leave site?" question, and
 * - leaving inside the app (a link, the command palette, logout) waits for `<LeaveGuard>`
 *   to confirm, via `whenSafeToLeave`, and
 * - the browser's Back first pops a spare entry for this same page (see `arm`), which
 *   `interceptBack` turns into the same question.
 */

let dirtyForms = 0;
let pendingLeave: (() => void) | null = null;
let pendingStay: (() => void) | null = null;
/** Whether the spare history entry for this page is on top of the stack. */
let armed = false;

/** Pushes a copy of the current entry, so Back lands on this page again instead of leaving it. */
function arm() {
  if (armed) return;
  armed = true;
  // Next's own state (`__NA`, its tree) is copied, so the router can still traverse the entry.
  window.history.pushState(window.history.state, "", window.location.href);
}

/**
 * For a capture-phase `popstate` listener, which runs before Next's router. When Back only popped
 * the spare entry of a page with unsaved changes, the router is stopped and the admin asked first.
 */
export function interceptBack(e: PopStateEvent) {
  if (!armed) return;
  armed = false;
  if (dirtyForms === 0) return;
  e.stopImmediatePropagation();
  whenSafeToLeave(
    () => window.history.back(),
    () => arm(),
  );
}
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** While `active`, leaving the page (in the app or closing the tab) asks first. */
export function useLeaveWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;
    dirtyForms += 1;
    arm();
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => {
      dirtyForms -= 1;
      // Saved or reverted: the spare entry stays as a plain copy of this page and is no longer ours.
      if (dirtyForms === 0) armed = false;
      window.removeEventListener("beforeunload", warn);
    };
  }, [active]);
}

/** Runs `leave` now, or once the admin confirms discarding unsaved changes; `stay` if they keep editing. */
export function whenSafeToLeave(leave: () => void, stay?: () => void) {
  if (dirtyForms === 0) return leave();
  pendingLeave = leave;
  pendingStay = stay ?? null;
  emit();
}

/** Whether a page has unsaved changes right now; read at click time, so not reactive. */
export const hasUnsavedChanges = () => dirtyForms > 0;

/** The navigation waiting on the admin's answer, for `<LeaveGuard>`. */
export function usePendingLeave() {
  return useSyncExternalStore(
    subscribe,
    () => pendingLeave,
    () => null,
  );
}

export function settlePendingLeave(confirmed: boolean) {
  const leave = pendingLeave;
  const stay = pendingStay;
  pendingLeave = null;
  pendingStay = null;
  emit();
  if (confirmed) leave?.();
  else stay?.();
}
