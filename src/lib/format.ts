/** Display formatting shared across screens. */

/** `৳4,000` — the sums here are whole taka, so the decimals are noise. */
export function money(value: number | string | null | undefined): string {
  const n = Number(value);
  if (value === null || value === undefined || value === "" || !Number.isFinite(n)) return "—";
  return `৳${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

/** `15 Sep 2026`. */
export function date(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** `15 Sep 2026, 7:47 pm`. */
export function dateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${date(value)}, ${d
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase()}`;
}

/** An `<input type="datetime-local">` wants exactly `YYYY-MM-DDTHH:mm`. */
export function toLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * A `datetime-local` value as the API's absolute moment, or `null` when blank. Given the stored value it
 * was filled from, an untouched input sends that back exactly: the input holds only whole minutes, so
 * converting it again would quietly move the time by up to 59 seconds.
 */
export function fromLocalInput(value: string, original?: string | null): string | null {
  if (!value) return null;
  if (original && toLocalInput(original) === value) return original;
  return new Date(value).toISOString();
}

const ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

/** One line of rich text's words: real tags removed (so "x<5 and y>3" survives) and entities decoded. */
export function plainText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<\/?[a-zA-Z][^<>]*>/g, " ")
    .replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (entity, name: string) => {
      if (name[0] !== "#") return ENTITIES[name.toLowerCase()] ?? entity;
      const code = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      return String.fromCodePoint(code);
    })
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Stored HTML as one line for `<RichContent>`: tags dropped, entities left encoded. Unlike
 * `plainText`, "&lt;br&gt;" stays text instead of turning back into a line break.
 */
export function previewHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<\/?[a-zA-Z][^<>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** `3 hours ago`, `yesterday`, `in 2 days`; `just now` under a minute. */
export function ago(value: string | null | undefined): string {
  if (!value) return "—";
  const seconds = (new Date(value).getTime() - Date.now()) / 1000;
  if (Number.isNaN(seconds)) return "—";
  if (Math.abs(seconds) < 60) return "just now";
  const [unit, size] = STEPS.find(([, s]) => Math.abs(seconds) >= s) ?? STEPS[STEPS.length - 1];
  return RELATIVE.format(Math.round(seconds / size), unit);
}
