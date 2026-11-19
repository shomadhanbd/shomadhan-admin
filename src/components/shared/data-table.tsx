"use client";

import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Column<T> {
  key: string;
  /** A node, not just text, so a column can be headed by a select-all box. */
  header: React.ReactNode;
  /** Right-align numeric columns so figures line up on the decimal. */
  align?: "left" | "right";
  /** Hidden below `sm`; use for columns that are context rather than identity. */
  secondary?: boolean;
  width?: string;
  /** The API's ordering field; set it and the header sorts the list. */
  sortKey?: string;
  /** For dates and counts the useful first click is newest or largest first. */
  sortFirst?: "asc" | "desc";
  cell: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  /** Rendered inside the table frame when there are no rows. */
  empty?: React.ReactNode;
  /** Held at reduced opacity during a refetch instead of flashing skeletons. */
  refreshing?: boolean;
  /** The current `?ordering=` value and its setter, from `useCrudList`. */
  sort?: string;
  onSort?: (sort: string) => void;
  /** The whole row opens this page… */
  rowHref?: (row: T) => string;
  /** …or does this, e.g. opens the row's edit dialog. */
  onRowClick?: (row: T) => void;
}

/** A click on a control inside the row does its own thing rather than opening the row. */
const OWN_CLICK = "a, button, input, select, textarea, label, [role=switch], [role=checkbox], [role=menuitem]";

function SortHeader({
  label,
  field,
  first,
  sort,
  onSort,
}: {
  label: React.ReactNode;
  field: string;
  first: "asc" | "desc";
  sort: string;
  onSort: (s: string) => void;
}) {
  const state = sort === field ? "asc" : sort === `-${field}` ? "desc" : null;
  const firstValue = first === "desc" ? `-${field}` : field;
  const secondValue = first === "desc" ? field : `-${field}`;
  // Cycles the first direction, the other direction, then back to the default order.
  const next = state === null ? firstValue : sort === firstValue ? secondValue : "";
  const Icon = state === "asc" ? ArrowUp : state === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={() => onSort(next)}
      aria-label={`Sort by ${typeof label === "string" ? label.toLowerCase() : field}`}
      className={cn(
        "-mx-1.5 inline-flex items-center gap-1 rounded-(--shape-xs) px-1.5 py-0.5 transition-colors hover:bg-accent hover:text-foreground",
        state && "text-foreground",
      )}
    >
      {label}
      <Icon className={cn("h-3.5 w-3.5", state ? "text-primary" : "opacity-50")} />
    </button>
  );
}

/** The shared data table; a refetch dims the previous rows instead of showing skeletons. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  empty,
  refreshing,
  sort = "",
  onSort,
  rowHref,
  onRowClick,
}: DataTableProps<T>) {
  const router = useRouter();
  const clickable = Boolean(rowHref || onRowClick);

  function openRow(row: T, e: React.MouseEvent) {
    if ((e.target as Element).closest(OWN_CLICK)) return;
    if (rowHref) {
      const href = rowHref(row);
      if (e.metaKey || e.ctrlKey) window.open(href, "_blank");
      else router.push(href);
    } else onRowClick?.(row);
  }

  return (
    <div className="overflow-hidden rounded-(--shape-md) surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/70">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  style={c.width ? { width: c.width } : undefined}
                  className={[
                    "text-xs font-semibold text-muted-foreground",
                    c.align === "right" ? "text-right" : "text-left",
                    c.secondary ? "hidden sm:table-cell" : "",
                  ].join(" ")}
                >
                  {c.sortKey && onSort ? (
                    <SortHeader
                      label={c.header}
                      field={c.sortKey}
                      first={c.sortFirst ?? "asc"}
                      sort={sort}
                      onSort={onSort}
                    />
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-border transition-opacity duration-(--duration-short) ${
              refreshing ? "opacity-60" : "opacity-100"
            }`}
          >
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key} className={c.secondary ? "hidden sm:table-cell" : ""}>
                      <Skeleton className="h-4 w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={clickable ? (e) => openRow(row, e) : undefined}
                  className={cn(
                    "transition-colors duration-(--duration-short) hover:bg-accent/70",
                    clickable && "cursor-pointer",
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={[
                        "align-middle",
                        c.align === "right" ? "text-right tabular-nums" : "",
                        c.secondary ? "hidden sm:table-cell" : "",
                      ].join(" ")}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* A hairline at the foot rather than a spinner over the rows: the
          rows stay readable while the next page loads. */}
      {refreshing && <div className="h-0.5 w-full animate-pulse bg-primary" />}
    </div>
  );
}

/** Page-size picker, range and page controls; hidden when everything fits on one page. */
export function Pagination({
  page,
  pageSize,
  total,
  from,
  to,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  from: number;
  to: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
}) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const controls = [
    { label: "First page", icon: ChevronsLeft, to: 1, disabled: page === 1 },
    { label: "Previous page", icon: ChevronLeft, to: page - 1, disabled: page === 1 },
    { label: "Next page", icon: ChevronRight, to: page + 1, disabled: page === lastPage },
    { label: "Last page", icon: ChevronsRight, to: lastPage, disabled: page === lastPage },
  ];

  return (
    <div className="flex flex-wrap items-center justify-end gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows</span>
        <Select value={String(pageSize)} onValueChange={(v: string | null) => onPageSize(Number(v ?? "25"))}>
          <SelectTrigger className="h-8 w-[4.5rem] text-sm" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["10", "25", "50", "100"].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <span className="text-sm text-muted-foreground tabular-nums">
        {from}–{to} of {total}
      </span>
      {lastPage > 1 && (
        <div className="flex items-center gap-0.5">
          {controls.map(({ label, icon: Icon, to: target, disabled }) => (
            <Button
              key={label}
              variant="ghost"
              size="icon"
              aria-label={label}
              className="h-8 w-8 text-muted-foreground"
              disabled={disabled}
              onClick={() => onPage(Math.min(lastPage, Math.max(1, target)))}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
