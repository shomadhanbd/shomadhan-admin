import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** The URL from an API media field (`{id, link}` or bare); `null` when absent. */
export function mediaUrl(value: { link?: string | null } | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value || null;
  return value.link || null;
}

/** A full http(s) address, as the backend's link fields accept. */
export const isWebLink = (value: string): boolean => /^https?:\/\/\S+\.\S+/.test(value.trim());

/** After deleting rows from a list page, steps back a page when that page is left empty. */
export function stepBackIfEmptied(
  rowsOnPage: number,
  removed: number,
  setPage: (update: (page: number) => number) => void,
): void {
  if (rowsOnPage - removed <= 0) setPage((page) => Math.max(1, page - 1));
}
