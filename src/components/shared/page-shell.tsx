"use client";

import Link from "next/link";
import { ArrowLeft, Search, X } from "lucide-react";
import { ago, dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyDoodles, Mascot } from "./doodles";

/** Page title, optional back link and the actions rail. */
export function PageHeader({
  title,
  description,
  backHref,
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Back"
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-(--shape-sm) surface text-muted-foreground shadow-none transition-colors hover:border-primary/30 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-1 truncate text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {/* Wraps rather than overflows: on a phone, search, filters and the main action each take a line. */}
      {children && <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">{children}</div>}
    </div>
  );
}

/** Search box with a clear button. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative w-full sm:w-auto ${className}`}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        // `bg-card` matters: the field inherited a transparent background, so
        // on the page's tinted surface it was a 1px hairline with nothing
        // inside it and barely read as an input at all.
        className="h-9 w-full bg-card pr-8 pl-9 text-sm shadow-xs sm:w-72"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/** Label, control and error, wired with `htmlFor`/`id`. */
export function Field({
  id,
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  /** For a field that should span differently inside a grid of fields. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-destructive">
            *
          </span>
        )}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** What a list shows when it is empty, with the action that creates the first item. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  /** Genuinely empty rather than filtered to nothing; only then is the mascot shown. */
  firstRun,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  firstRun?: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center px-6 py-16 text-center">
      <EmptyDoodles />

      {firstRun ? (
        <Mascot className="relative mb-5 h-24 w-24 text-primary/40" />
      ) : (
        icon && (
          <span className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-surface text-primary dark:text-accent-foreground">
            {icon}
          </span>
        )
      )}

      <p className="relative text-[15px] font-semibold text-foreground">{title}</p>
      {description && <p className="relative mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  );
}

/** "batches" → "batch", "users" → "user": enough for the nouns the lists use. */
const singular = (noun: string) => (/(ch|sh|x)es$/.test(noun) ? noun.slice(0, -2) : noun.replace(/s$/, ""));

/**
 * The row of search and filters under a list's title, with how many rows match and a way to
 * clear what is set. Every list uses it, so the controls always sit in the same place.
 */
export function ListToolbar({
  children,
  total,
  noun,
  filtered,
  onClear,
}: {
  children: React.ReactNode;
  /** Rows matching now; hidden until the first load answers. */
  total?: number;
  /** Plural, e.g. "users"; the singular drops the trailing "s". */
  noun: string;
  filtered: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      {filtered && (
        <Button variant="ghost" size="lg" onClick={onClear} className="text-muted-foreground">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
      {total !== undefined && (
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">
          {total.toLocaleString()} {total === 1 ? singular(noun) : noun}
          {filtered ? " match" : ""}
        </span>
      )}
    </div>
  );
}

/** "3 hours ago", with the exact moment on hover. */
export function TimeAgo({ value, className }: { value: string | null | undefined; className?: string }) {
  if (!value) return <span className={cn("text-sm text-muted-foreground", className)}>Never</span>;
  return (
    <time dateTime={value} title={dateTime(value)} className={cn("text-sm whitespace-nowrap", className)}>
      {ago(value)}
    </time>
  );
}
