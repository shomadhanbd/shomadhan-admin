"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
}

/** The shared data table; a refetch dims the previous rows instead of showing skeletons. */
export function DataTable<T>({ columns, rows, rowKey, loading, empty, refreshing }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-(--shape-md) bg-card shadow-sm ring-1 ring-foreground/[0.07]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  style={c.width ? { width: c.width } : undefined}
                  className={[
                    "text-xs font-medium tracking-wide text-muted-foreground uppercase",
                    c.align === "right" ? "text-right" : "text-left",
                    c.secondary ? "hidden sm:table-cell" : "",
                  ].join(" ")}
                >
                  {c.header}
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
                  className="transition-colors duration-(--duration-short) hover:bg-primary/(--state-hover)"
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
      {refreshing && <div className="h-0.5 w-full animate-pulse bg-primary/40" />}
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
