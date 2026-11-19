/** Initials in a soft tint of one of the four accents, the same one for a person every time. */
export function PersonAvatar({
  id,
  name,
  className = "h-9 w-9 text-xs",
}: {
  id: number | null;
  name: string;
  className?: string;
}) {
  const words = name.replace(/^\+/, "").trim().split(/\s+/).filter(Boolean);
  // A mobile number has no initials worth showing; its last two digits tell people apart.
  const initials = /^\d/.test(words[0] ?? "")
    ? (words[0] ?? "").slice(-2)
    : words
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
  const tile = `var(--tile-${((id ?? 0) % 4) + 1})`;

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${className}`}
      style={{ background: `color-mix(in oklab, ${tile} 15%, transparent)`, color: tile }}
    >
      {initials || "?"}
    </span>
  );
}
