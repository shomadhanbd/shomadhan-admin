"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { money } from "@/lib/format";
import { dashboardApi, dashboardKeys } from "@/features/dashboard/api";
import { Skeleton } from "@/components/ui/skeleton";
import { LookupSelect } from "@/components/shared/lookup-select";
import type { TrendRange, Trends } from "@/features/dashboard/types";
import { LineChart, type Series, type TrendDatum } from "./line-chart";

const RANGES: { id: TrendRange; name: string; per: string }[] = [
  { id: "7d", name: "7 days", per: "per day" },
  { id: "30d", name: "1 month", per: "per day" },
  { id: "3m", name: "3 months", per: "per week" },
  { id: "6m", name: "6 months", per: "per week" },
  { id: "1y", name: "1 year", per: "per month" },
];

/** One graph with its own range; ranges are cached, so two graphs on the same range share a request. */
function TrendChart({
  title,
  note,
  series,
  points,
}: {
  title: string;
  note: (per: string) => string;
  series: Series[];
  points: (t: Trends) => TrendDatum[];
}) {
  const [range, setRange] = useState<TrendRange>("30d");
  const { data, isFetching } = useQuery({
    queryKey: dashboardKeys.trends(range),
    queryFn: () => dashboardApi.trends(range),
    placeholderData: keepPreviousData,
    refetchInterval: 5 * 60_000,
  });
  const preset = RANGES.find((r) => r.id === range)!;

  return (
    <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/[0.07]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{note(preset.per)}</p>
        </div>
        <LookupSelect
          ariaLabel={`${title} range`}
          value={range}
          onChange={(v) => v && setRange(v as TrendRange)}
          options={RANGES}
          placeholder="1 month"
          className="w-32 bg-card"
        />
      </div>

      <div className={cn("mt-3 transition-opacity", isFetching && data && "opacity-60")}>
        {data ? (
          <LineChart bucket={data.bucket} series={series} data={points(data)} />
        ) : (
          <Skeleton className="h-[200px] rounded-(--shape-sm)" />
        )}
      </div>
    </section>
  );
}

const USERS: Series[] = [{ key: "users", label: "new users", color: "var(--chart-1)" }];

// Fixed order: the colour follows the source, never its rank.
const PURCHASES: Series[] = [
  { key: "purchases", label: "All", color: "var(--series-1)" },
  { key: "sslcommerz", label: "SSLCommerz", color: "var(--series-2)" },
  { key: "app_store", label: "App Store", color: "var(--series-3)" },
  { key: "manual", label: "Manual grant", color: "var(--series-4)" },
];

/** New users and purchases over time, one graph per row, each with its own range. */
export function TrendCharts() {
  return (
    <div className="space-y-4">
      <TrendChart
        title="New users"
        note={(per) => `Accounts created, ${per}`}
        series={USERS}
        points={(t) => t.points.map((p) => ({ start: p.start, values: { users: p.users } }))}
      />
      <TrendChart
        title="Purchases"
        note={(per) => `By source, ${per}. Manual grants are VIP given by an admin`}
        series={PURCHASES}
        points={(t) =>
          t.points.map((p) => ({
            start: p.start,
            values: { purchases: p.purchases, sslcommerz: p.sslcommerz, app_store: p.app_store, manual: p.manual },
            detail: p.amount ? `${money(p.amount)} via SSLCommerz` : undefined,
          }))
        }
      />
    </div>
  );
}
