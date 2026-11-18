"use client";

import { useSyncExternalStore } from "react";

/** Nothing to subscribe to: the value flips once and never changes again. */
const noopSubscribe = () => () => {};

/** `false` on the server and during hydration, `true` after; avoids hydration mismatches for client-only values. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
