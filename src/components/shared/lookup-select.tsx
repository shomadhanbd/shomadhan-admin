"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LookupSelectProps {
  /** Wires a form field's label; a toolbar filter passes `ariaLabel` instead. */
  id?: string;
  ariaLabel?: string;
  /** The chosen row's id as a string; `""` is nothing chosen. */
  value: string;
  onChange: (value: string) => void;
  options: { id: number; name: string }[] | undefined;
  placeholder: string;
  /** Adds a first option that clears the choice, e.g. "All subjects" on a filter. */
  allLabel?: string;
  disabled?: boolean;
  className?: string;
}

/** A dropdown over rows from `lib/lookups.ts`, used both as a toolbar filter and as a form field. */
export function LookupSelect({
  id,
  ariaLabel,
  value,
  onChange,
  options,
  placeholder,
  allLabel,
  disabled,
  className,
}: LookupSelectProps) {
  // The trigger shows the raw value unless told the name that goes with it.
  const labels = useMemo(() => Object.fromEntries((options ?? []).map((o) => [String(o.id), o.name])), [options]);

  return (
    <Select value={value} onValueChange={(v: string | null) => onChange(v ?? "")} disabled={disabled}>
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn("h-9", className)}>
        <SelectValue placeholder={placeholder} labels={labels} />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value="">{allLabel}</SelectItem>}
        {(options ?? []).map((o) => (
          <SelectItem key={o.id} value={String(o.id)}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
