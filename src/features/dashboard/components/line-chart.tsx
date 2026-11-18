"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { TrendBucket } from "@/features/dashboard/types";

const HEIGHT = 200;
const PAD = { top: 12, right: 8, bottom: 24, left: 36 };

const DHAKA = "Asia/Dhaka";
const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: DHAKA, ...opts });
const DAY = fmt({ day: "numeric", month: "short" });
const MONTH = fmt({ month: "short" });
const MONTH_YEAR = fmt({ month: "short", year: "numeric" });
const FULL_DAY = fmt({ weekday: "short", day: "numeric", month: "short", year: "numeric" });

/** The short axis label for a bucket. */
function tickLabel(start: string, bucket: TrendBucket) {
  const d = new Date(start);
  if (bucket === "month") return MONTH.format(d);
  return DAY.format(d);
}

/** The full period a bucket covers, for the tooltip and the table. */
export function periodLabel(start: string, bucket: TrendBucket) {
  const d = new Date(start);
  if (bucket === "week") return `Week of ${FULL_DAY.format(d)}`;
  if (bucket === "month") return MONTH_YEAR.format(d);
  return FULL_DAY.format(d);
}

/** A clean axis top (1, 2 or 5 × 10ⁿ steps) and its ticks, never below 4 so small counts stay readable. */
function niceTicks(max: number) {
  const top = Math.max(max, 4);
  const raw = top / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const ticks = [];
  for (let v = 0; v <= top + step / 2 && ticks.length < 7; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < top) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

const axisNumber = (n: number) => (n >= 10_000 ? `${Math.round(n / 1000)}K` : n.toLocaleString());

/** Track the container's width so the SVG draws at real pixels and text never stretches. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

export interface Series {
  key: string;
  /** Names the line in the legend, the tooltip and the table. */
  label: string;
  color: string;
}

export interface TrendDatum {
  start: string;
  values: Record<string, number>;
  /** Extra line at the foot of the tooltip. */
  detail?: string;
}

/**
 * Lines over time sharing one axis; a crosshair snaps to the nearest point and the
 * tooltip lists every line there. One line gets a light area wash and no legend (the
 * title names it); several get a legend.
 */
export function LineChart({
  data,
  bucket,
  series: allSeries,
}: {
  data: TrendDatum[];
  bucket: TrendBucket;
  series: Series[];
}) {
  const [ref, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  // Lines switched off from the legend. Colours stay with their series either way.
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const series = allSeries.filter((s) => !hidden.has(s.key));

  function toggle(key: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      // At least one line always stays.
      else if (allSeries.length - next.size > 1) next.add(key);
      return next;
    });
  }

  const max = Math.max(0, ...data.flatMap((d) => series.map((s) => d.values[s.key] ?? 0)));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const base = PAD.top + plotH;
  // Each point sits in the middle of its slot, so the slot is its hit target.
  const band = data.length ? plotW / data.length : 0;
  const x = (i: number) => PAD.left + band * i + band / 2;
  const y = (v: number) => base - (v / top) * plotH;
  // Every nth axis label, so they never collide.
  const every = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotW / 52))));
  const last = data.length - 1;
  const single = allSeries.length === 1;

  const path = (key: string) => data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.values[key] ?? 0)}`).join(" ");
  const hovered = active != null ? data[active] : null;

  function pick(clientX: number, el: Element) {
    if (!data.length) return;
    const i = Math.floor((clientX - el.getBoundingClientRect().left - PAD.left) / band);
    setActive(Math.min(last, Math.max(0, i)));
  }

  return (
    <div>
      {!single && (
        <div role="group" aria-label="Lines shown" className="mb-2 flex flex-wrap gap-1">
          {allSeries.map((s) => {
            const on = !hidden.has(s.key);
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={on}
                title={on ? `Hide ${s.label}` : `Show ${s.label}`}
                onClick={() => toggle(s.key)}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors",
                  on
                    ? "border-border bg-card text-foreground hover:bg-surface-2"
                    : "border-dashed border-border text-muted-foreground line-through hover:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className="h-0.5 w-3 rounded-full"
                  style={{ background: on ? s.color : "var(--muted-foreground)" }}
                />
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      <div ref={ref} className="relative" onPointerLeave={() => setActive(null)}>
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`${series.map((s) => s.label).join(", ")} over time; the table below lists every value`}
            tabIndex={0}
            onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
            onFocus={() => setActive(last)}
            onBlur={() => setActive(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? last) - 1));
              if (e.key === "ArrowRight") setActive((a) => Math.min(last, (a ?? last) + 1));
            }}
            className="rounded-(--shape-sm) outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
                <text
                  x={PAD.left - 6}
                  y={y(t)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px]"
                >
                  {axisNumber(t)}
                </text>
              </g>
            ))}

            {data.map(
              (d, i) =>
                i % every === 0 && (
                  <text
                    key={d.start}
                    x={x(i)}
                    y={HEIGHT - 6}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {tickLabel(d.start, bucket)}
                  </text>
                ),
            )}

            {single && data.length > 0 && (
              <path
                d={`${path(series[0].key)} L${x(last)},${base} L${x(0)},${base} Z`}
                fill={series[0].color}
                opacity={0.1}
              />
            )}
            {/* Drawn last-first so the first series (the total) sits on top. */}
            {[...series].reverse().map((s) => (
              <path
                key={s.key}
                d={path(s.key)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {active != null && (
              <line
                x1={x(active)}
                x2={x(active)}
                y1={PAD.top}
                y2={base}
                stroke="var(--muted-foreground)"
                strokeWidth={1}
                opacity={0.5}
              />
            )}
            {/* The latest point is always marked, the hovered one too; a surface ring keeps each off the lines. */}
            {[...new Set([last, active ?? last])].flatMap((i) =>
              i < 0
                ? []
                : [...series]
                    .reverse()
                    .map((s) => (
                      <circle
                        key={`${s.key}-${i}`}
                        cx={x(i)}
                        cy={y(data[i].values[s.key] ?? 0)}
                        r={4}
                        fill={s.color}
                        stroke="var(--card)"
                        strokeWidth={2}
                      />
                    )),
            )}
          </svg>
        )}

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-max max-w-60 -translate-x-1/2 rounded-(--shape-sm) bg-popover px-3 py-2 text-xs shadow-md ring-1 ring-foreground/10"
            style={{ left: Math.min(Math.max(x(active!), 100), width - 100) }}
          >
            <p className="mb-1 text-muted-foreground">{periodLabel(hovered.start, bucket)}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center gap-2">
                <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
                <span className="font-semibold text-popover-foreground">
                  {(hovered.values[s.key] ?? 0).toLocaleString()}
                </span>
                <span className="text-muted-foreground">{s.label}</span>
              </p>
            ))}
            {hovered.detail && <p className="mt-1 text-muted-foreground">{hovered.detail}</p>}
          </div>
        )}
      </div>

      <table className="sr-only">
        <caption>{series.map((s) => s.label).join(", ")}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.start}>
              <td>{periodLabel(d.start, bucket)}</td>
              {series.map((s) => (
                <td key={s.key}>{d.values[s.key] ?? 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
