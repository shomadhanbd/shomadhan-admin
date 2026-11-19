"use client";

import { ArrowRight } from "lucide-react";
import { RichContent } from "@/components/shared/rich-content";

type Metadata = Record<string, unknown>;
type Option = { id: number | string; label?: string; content: string };

export interface KeyBlank {
  id: string;
  /** The answer the key gives first, and every other answer it takes. */
  answers: string[];
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const humanise = (value: string) => value.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/**
 * A fill-in-the-blank's blanks as the app grades them: `answer_text`, any `accepts` beside it,
 * or the word-box option `correct_option_ref` points at.
 */
export function keyBlanks(metadata: Metadata, options: Option[] = []): KeyBlank[] {
  return list(metadata.blanks).map((raw, index) => {
    const blank = (raw ?? {}) as Record<string, unknown>;
    const ref = text(blank.correct_option_ref);
    const option = ref ? options.find((o) => String(o.id) === ref || o.label === ref) : undefined;
    const answers = [text(blank.answer_text), ...list(blank.accepts).map(text), option ? option.content : ""].filter(
      Boolean,
    );
    return { id: text(blank.id) || String(index + 1), answers: [...new Set(answers)] };
  });
}

/** The answer key a question keeps in its metadata, shown as a teacher would read it. */
export function AnswerKey({ type, metadata, options }: { type: string; metadata: Metadata; options?: Option[] }) {
  if (type === "fib") {
    const blanks = keyBlanks(metadata, options);
    const subtype = text(metadata.fib_subtype);
    if (!blanks.length) return null;
    return (
      <div className="space-y-1.5">
        {subtype && <p className="text-xs text-muted-foreground">{humanise(subtype)}</p>}
        <ol className="space-y-1 text-sm">
          {blanks.map((blank) => (
            <li key={blank.id} className="flex flex-wrap items-baseline gap-x-2">
              <span className="w-6 shrink-0 font-medium text-muted-foreground">({blank.id})</span>
              <RichContent content={blank.answers[0] ?? "–"} className="font-medium text-foreground" />
              {blank.answers.length > 1 && (
                <span className="text-xs text-muted-foreground">also accepts {blank.answers.slice(1).join(", ")}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (type === "flow_chart") {
    const nodes = list(metadata.nodes).map((raw) => (raw ?? {}) as Record<string, unknown>);
    if (!nodes.length) return null;
    return (
      <ol className="space-y-1 text-sm">
        {nodes.map((node, index) => {
          const next = list(node.connects_to).map(String);
          return (
            <li key={text(node.id) || index} className="flex flex-wrap items-baseline gap-x-2">
              <span className="w-6 shrink-0 font-medium text-muted-foreground">{text(node.id) || index + 1}</span>
              <RichContent content={text(node.text) || "–"} className="text-foreground" />
              {node.prefilled === true && <span className="text-xs text-muted-foreground">(given)</span>}
              {next.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowRight className="h-3 w-3" />
                  {next.join(", ")}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    );
  }

  // Long answers, transformations and anything else: whatever the key holds, labelled.
  return <Details value={metadata} />;
}

const isEmpty = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && !value.trim()) ||
  (Array.isArray(value) && value.every(isEmpty)) ||
  (typeof value === "object" && !Array.isArray(value) && Object.values(value as object).every(isEmpty));

/** Any value from a key, readably: text as written, lists as lists, records as labelled rows. */
function Details({ value, name = "" }: { value: unknown; name?: string }) {
  if (isEmpty(value)) return name ? <span className="text-muted-foreground">–</span> : null;
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  if (typeof value !== "object") {
    const text = String(value);
    if (name.endsWith("_url")) {
      return (
        <a href={text} target="_blank" rel="noreferrer" className="text-primary hover:underline">
          Open
        </a>
      );
    }
    return name.endsWith("subtype") ? <>{humanise(text)}</> : <RichContent content={text} className="inline" />;
  }
  if (Array.isArray(value)) {
    const items = value.filter((item) => !isEmpty(item));
    if (items.every((item) => typeof item !== "object")) return <>{items.map(String).join(", ")}</>;
    return (
      <ol className="list-decimal space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={index}>
            <Details value={item} />
          </li>
        ))}
      </ol>
    );
  }
  const rows = Object.entries(value as Record<string, unknown>).filter(([, v]) => !isEmpty(v));
  return (
    <dl className="space-y-1 text-sm">
      {rows.map(([key, v]) => (
        <div key={key} className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">{humanise(key)}</dt>
          <dd className="min-w-0 text-foreground">
            <Details value={v} name={key} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
