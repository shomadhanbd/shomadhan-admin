import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** After deleting rows from a list page, steps back a page when that page is left empty. */
export function stepBackIfEmptied(
  rowsOnPage: number,
  removed: number,
  setPage: (update: (page: number) => number) => void,
): void {
  if (rowsOnPage - removed <= 0) setPage((page) => Math.max(1, page - 1));
}
