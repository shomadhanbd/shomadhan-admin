"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Update = string | ((current: string) => string);

/*
 * Writes made in the same tick (a filter and "back to page 1") are merged into one
 * `router.replace`, so neither overwrites the other with a stale address.
 * `null` removes the key: the value is back to its fallback.
 */
let pending: Map<string, string | null> | null = null;

function writeParam(router: ReturnType<typeof useRouter>, key: string, value: string | null) {
  if (!pending) {
    pending = new Map();
    queueMicrotask(() => {
      const changes = pending!;
      pending = null;
      const params = new URLSearchParams(window.location.search);
      changes.forEach((v, k) => (v === null ? params.delete(k) : params.set(k, v)));
      const query = params.toString();
      router.replace(`${window.location.pathname}${query ? `?${query}` : ""}`, { scroll: false });
    });
  }
  pending.set(key, value);
}

/**
 * A string kept in the page's address (`?key=value`), so the browser's Back, a reload or a shared link
 * restore it. The fallback is left out of the address; any other value, even "", is written. With `inUrl`
 * false it is plain component state, for a list inside a dialog that must not touch the page's address.
 */
export function useUrlState(key: string, fallback = "", inUrl = true): [string, (update: Update) => void] {
  const router = useRouter();
  const params = useSearchParams();
  const [local, setLocal] = useState(fallback);

  const value = inUrl ? (params.get(key) ?? fallback) : local;

  const set = useCallback(
    (update: Update) => {
      if (!inUrl) return setLocal(update);
      // Read the address now rather than at render, so a functional update sees the latest value.
      const staged = pending?.has(key) ? pending.get(key) : undefined;
      const current =
        staged !== undefined
          ? (staged ?? fallback)
          : (new URLSearchParams(window.location.search).get(key) ?? fallback);
      const next = typeof update === "function" ? update(current) : update;
      writeParam(router, key, next === fallback ? null : next);
    },
    [inUrl, key, fallback, router],
  );

  return [value, set];
}

/** A whole-number `useUrlState`, e.g. the page of a list. */
export function useUrlNumber(
  key: string,
  fallback: number,
  inUrl = true,
): [number, (update: number | ((n: number) => number)) => void] {
  const [raw, setRaw] = useUrlState(key, String(fallback), inUrl);
  const parsed = Number.parseInt(raw, 10);
  const value = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;

  const set = useCallback(
    (update: number | ((n: number) => number)) =>
      setRaw((current) => {
        const n = Number.parseInt(current, 10);
        const base = Number.isFinite(n) && n > 0 ? n : fallback;
        return String(typeof update === "function" ? update(base) : update);
      }),
    [setRaw, fallback],
  );

  return [value, set];
}

/** A day range kept as `?from=…&to=…`, for the date filters. */
export function useUrlRange(): [{ from: string; to: string }, (range: { from: string; to: string }) => void] {
  const [from, setFrom] = useUrlState("from");
  const [to, setTo] = useUrlState("to");
  const set = useCallback(
    (range: { from: string; to: string }) => {
      setFrom(range.from);
      setTo(range.to);
    },
    [setFrom, setTo],
  );
  return [{ from, to }, set];
}
