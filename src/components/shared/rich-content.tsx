"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/page-shell";

/** `$$…$$` is display math, `$…$` inline; the same delimiters the mobile app renders. */
const MATH = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

const ENTITIES: Record<string, string> = { "&lt;": "<", "&gt;": ">", "&amp;": "&" };

function toHtml(content: string): string {
  // Sanitised first, so nothing in stored content can run in the panel; KaTeX's own markup is added after.
  return DOMPurify.sanitize(content).replace(MATH, (_match, block?: string, inline?: string) =>
    // The sanitiser escapes `<` and `&` inside the formula, which KaTeX must see unescaped.
    katex.renderToString(
      (block ?? inline ?? "").replace(/&(lt|gt|amp);/g, (entity) => ENTITIES[entity]),
      {
        displayMode: block !== undefined,
        throwOnError: false,
      },
    ),
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
