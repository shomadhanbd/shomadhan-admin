"use client";

/** A pick-any-number control: every option is a chip that toggles on and off. */
export function ChipSelect({
  label,
  options,
  value,
  onChange,
  empty,
}: {
  label: string;
  options: { id: number; name: string }[] | undefined;
  value: number[];
  onChange: (value: number[]) => void;
  /** Shown in place of the chips when there is nothing to pick from. */
  empty?: string;
}) {
  return (
    <div className="space-y-1.5" role="group" aria-label={label}>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {options?.length ? (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const active = value.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(active ? value.filter((id) => id !== option.id) : [...value, option.id])}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary-surface text-primary"
                    : "border-border text-muted-foreground hover:border-foreground/20"
                }`}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      ) : (
        empty && <p className="text-xs text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}
