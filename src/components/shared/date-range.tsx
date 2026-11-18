"use client";

import { Input } from "@/components/ui/input";

/** Day-range inputs; the API takes `<field>__date__gte` and `__lte`. */
export function DateRange({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="date"
        aria-label="From date"
        value={from}
        max={to || undefined}
        onChange={(e) => onChange({ from: e.target.value, to })}
        className="h-9 w-40 bg-card"
      />
      <span className="text-sm text-muted-foreground">to</span>
      <Input
        type="date"
        aria-label="To date"
        value={to}
        min={from || undefined}
        onChange={(e) => onChange({ from, to: e.target.value })}
        className="h-9 w-40 bg-card"
      />
    </div>
  );
}
