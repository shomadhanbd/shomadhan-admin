"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/page-shell";

/**
 * A well-formed HTML tag, or a formula: `$$…$$` is display math and `$…$` inline, the delimiters the mobile app
 * renders. An inline formula may not start or end with a space, nor be followed by a digit, so prices such as
 * "$5 and $10" stay text.
 */
const TOKEN = /(<\/?[a-zA-Z][^<>]*>)|\$\$([\s\S]+?)\$\$|\$(?!\s)([^$\n]+?)(?<!\s)\$(?!\d)/g;

const ENTITIES: Record<string, string> = { "&lt;": "<", "&gt;": ">", "&amp;": "&" };

/** Stands in for a formula while the surrounding HTML is sanitised; plain text, so the sanitiser keeps it. */
const placeholder = (index: number) => `@@math${index}@@`;

function toHtml(content: string): string {
  // Formulas are lifted out before sanitising. Left in, `$x<y$` loses its tail: the sanitiser reads `<y…` as a tag.
  // Tags are matched too, only so that a `$` inside an attribute is skipped rather than taken for a delimiter.
  const formulas: string[] = [];
  const lifted = content.replace(TOKEN, (match, tag?: string, block?: string, inline?: string) => {
    if (tag) return match;
    const tex = (block ?? inline ?? "").replace(/&(lt|gt|amp);/g, (entity) => ENTITIES[entity]);
    formulas.push(katex.renderToString(tex, { displayMode: block !== undefined, throwOnError: false }));
    return placeholder(formulas.length - 1);
  });
  // Sanitised so nothing in stored content can run in the panel; KaTeX's own markup goes back in after.
  return DOMPurify.sanitize(lifted).replace(
    /@@math(\d+)@@/g,
    (match, index: string) => formulas[Number(index)] ?? match,
  );
}

/** Question content as students see it: the stored HTML with its LaTeX rendered. */
export function RichContent({ content, className }: { content: string; className?: string }) {
  // The sanitiser needs a browser DOM, so nothing is rendered on the server.
  const hydrated = useHydrated();
  const html = useMemo(() => (hydrated ? toHtml(content) : ""), [content, hydrated]);

  return (
    <div
      className={cn(
        "text-sm leading-relaxed break-words text-foreground [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_ul]:list-disc [&_ul]:pl-5",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** A textarea for HTML + LaTeX content with a live preview underneath. */
export function ContentField({
  id,
  label,
  value,
  onChange,
  required,
  hint,
  rows = 3,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <Field id={id} label={label} required={required} hint={hint}>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="font-mono text-xs"
      />
      {value.trim() && (
        <div className="rounded-(--shape-sm) bg-surface-2 px-3 py-2">
          <p className="mb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Preview</p>
          <RichContent content={value} />
        </div>
      )}
    </Field>
  );
}
