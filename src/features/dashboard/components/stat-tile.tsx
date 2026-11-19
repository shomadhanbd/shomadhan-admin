"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Compact headline number: 1,284 / 12.9K / 4.2M. */
export function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 10_000) return `${(value / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}K`;
  return value.toLocaleString();
}

/** Which of the theme's four accent slots (`--tile-1..4`) a tile uses. */
type Accent = 1 | 2 | 3 | 4;

interface StatTileProps {
  label: string;
  value: number;
  prefix?: string;
  /** Secondary line — a named comparison period, never an invented delta. */
  context?: string;
  icon: React.ReactNode;
  accent: Accent;
  loading?: boolean;
  /** `sm` for a row of headline cards that should not dominate the page. */
  size?: "md" | "sm";
}

/** label · value · context on a card; the icon tint tells tiles apart and encodes nothing. */
export function StatTile({ label, value, prefix, context, icon, accent, loading, size = "md" }: StatTileProps) {
  const sm = size === "sm";
  if (loading) return <Skeleton className={sm ? "h-[104px] rounded-(--shape-md)" : "h-[132px] rounded-(--shape-md)"} />;

  const tile = `var(--tile-${accent})`;

  return (
    <div
      className={`group relative h-full overflow-hidden rounded-(--shape-md) surface ${sm ? "p-4" : "p-5"} transition-shadow duration-(--duration-medium) hover:shadow-(--shadow-raised)`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="line-clamp-2 text-sm leading-snug font-medium text-muted-foreground">{label}</span>
        {/* A soft tint of the accent behind the icon, as the app does for its subject icons. */}
        <span
          className={`flex ${sm ? "h-8 w-8" : "h-9 w-9"} shrink-0 items-center justify-center rounded-(--shape-sm)`}
          style={{ background: `color-mix(in oklab, ${tile} 14%, transparent)`, color: tile }}
        >
          {icon}
        </span>
      </div>

      {/* Proportional figures, not tabular: equal-width digits make a number
          like 121 look loose at display sizes. */}
      <p
        className={`${sm ? "mt-1.5 text-[28px]" : "mt-3 text-3xl"} leading-none font-bold tracking-tight text-foreground`}
      >
        {prefix}
        {compact(value)}
      </p>
      {context && <p className={`${sm ? "mt-2" : "mt-2.5"} line-clamp-2 text-xs text-muted-foreground`}>{context}</p>}
    </div>
  );
}
