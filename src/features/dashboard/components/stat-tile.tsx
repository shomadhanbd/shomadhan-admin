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

/** label · value · context on a raised surface; the accents are decorative, not an encoding. */
export function StatTile({ label, value, prefix, context, icon, accent, loading, size = "md" }: StatTileProps) {
  const sm = size === "sm";
  if (loading) return <Skeleton className={sm ? "h-[104px] rounded-2xl" : "h-[132px] rounded-2xl"} />;

  // `color-mix` supplies the gradient's darker stop, so a theme declares one
  // colour per slot rather than a from/to pair.
  const tile = `var(--tile-${accent})`;

  return (
    <div
      className={`group relative h-full overflow-hidden rounded-2xl bg-card ${sm ? "p-4" : "p-5"} shadow-sm ring-1 ring-foreground/[0.07] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-foreground/[0.12]`}
    >
      {/* Hairline of accent along the top edge — enough colour to tell the
          cards apart at a glance without tinting the whole surface. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(to right, ${tile}, transparent)` }}
      />

      <div className="flex items-start justify-between gap-3">
        <span className="truncate text-sm font-medium text-muted-foreground">{label}</span>
        <span
          className={`flex ${sm ? "h-7 w-7" : "h-8 w-8"} shrink-0 items-center justify-center rounded-lg text-white shadow-sm`}
          style={{
            background: `linear-gradient(135deg, ${tile}, color-mix(in oklab, ${tile} 78%, black))`,
          }}
        >
          {icon}
        </span>
      </div>

      {/* Proportional figures, not tabular: equal-width digits make a number
          like 121 look loose at display sizes. Tabular is for columns that
          align vertically — axis ticks and table rows. */}
      <p
        className={`${sm ? "mt-2 text-2xl" : "mt-4 text-3xl"} leading-none font-semibold tracking-tight text-foreground`}
      >
        {prefix}
        {compact(value)}
      </p>
      {context && <p className={`${sm ? "mt-2" : "mt-2.5"} truncate text-xs text-muted-foreground`}>{context}</p>}
    </div>
  );
}
