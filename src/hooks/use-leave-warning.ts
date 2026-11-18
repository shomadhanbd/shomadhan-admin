"use client";

import { useEffect, useSyncExternalStore } from "react";

/*
 * Unsaved-changes guard. A form calls `useLeaveWarning(dirty)`; while any form is dirty:
 * - closing or reloading the tab asks the browser's own "leave site?" question, and
 * - leaving inside the app (a link, the command palette, logout) waits for `<LeaveGuard>`
 *   to confirm, via `whenSafeToLeave`.
 */

let dirtyForms = 0;
let pendingLeave: (() => void) | null = null;
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
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => {
      dirtyForms -= 1;
      window.removeEventListener("beforeunload", warn);
    };
  }, [active]);
}

/** Runs `leave` now, or once the admin confirms discarding unsaved changes. */
export function whenSafeToLeave(leave: () => void) {
  if (dirtyForms === 0) return leave();
  pendingLeave = leave;
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
  pendingLeave = null;
  emit();
  if (confirmed) leave?.();
}
