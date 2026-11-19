"use client";

import { useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/page-shell";
import { VisualEditor } from "@/components/shared/visual-editor";

/**
 * A well-formed HTML tag, or a formula: `$$…$$` is display math and `$…$` inline, the delimiters the mobile app
 * renders. An inline formula may not start or end with a space, nor be followed by a digit, so prices such as
 * "$5 and $10" stay text.
 */
const TOKEN = /(<\/?[a-zA-Z][^<>]*>)|\$\$([\s\S]+?)\$\$|\$(?!\s)([^$\n]+?)(?<!\s)\$(?!\d)/g;

const ENTITIES: Record<string, string> = { "&lt;": "<", "&gt;": ">", "&amp;": "&" };

/** The tags question content may use, as in the backend's import and the mobile app; no attributes at all. */
const ALLOWED_TAGS = ["b", "i", "u", "sup", "sub", "br", "ul", "ol", "li", "p"];

function toHtml(content: string): string {
  // Formulas are lifted out before sanitising. Left in, `$x<y$` loses its tail: the sanitiser reads `<y…` as a tag.
  // Tags are matched too, only so that a `$` inside an attribute is skipped rather than taken for a delimiter.
  // Each formula's stand-in is plain text, so the sanitiser keeps it. Its random part means stored
  // content cannot spell one out to get markup of its own past the sanitiser.
  const marker = `@@math-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}-`;
  const formulas: string[] = [];
  const lifted = content.replace(TOKEN, (match, tag?: string, block?: string, inline?: string) => {
    if (tag) return match;
    const tex = (block ?? inline ?? "").replace(/&(lt|gt|amp);/g, (entity) => ENTITIES[entity]);
    formulas.push(katex.renderToString(tex, { displayMode: block !== undefined, throwOnError: false }));
    return `${marker}${formulas.length - 1}@@`;
  });
  // Sanitised so nothing in stored content can run or restyle the panel; KaTeX's own markup goes back in after.
  const clean = DOMPurify.sanitize(lifted, { ALLOWED_TAGS, ALLOWED_ATTR: [] });
  return clean.replace(
    new RegExp(`${marker}(\\d+)@@`, "g"),
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

/** The formats the toolbar inserts: the tags the mobile app renders, and the two maths delimiters. */
const FORMATS: { label: string; title: string; before: string; after: string; className?: string }[] = [
  { label: "B", title: "Bold", before: "<b>", after: "</b>", className: "font-bold" },
  { label: "I", title: "Italic", before: "<i>", after: "</i>", className: "italic" },
  { label: "U", title: "Underline", before: "<u>", after: "</u>", className: "underline" },
  { label: "x²", title: "Superscript", before: "<sup>", after: "</sup>" },
  { label: "x₂", title: "Subscript", before: "<sub>", after: "</sub>" },
  { label: "$x$", title: "Inline maths", before: "$", after: "$", className: "font-mono" },
  { label: "$$", title: "Maths on its own line", before: "$$", after: "$$", className: "font-mono" },
  { label: "↵", title: "Line break", before: "<br>", after: "" },
];

/**
 * A textarea for HTML + LaTeX content, with a toolbar that wraps the selection in a format and a live preview.
 * `previewClassName` lets a page that shows its own preview hide this one at the sizes where it does.
 */
export function ContentField({
  id,
  label,
  value,
  onChange,
  required,
  hint,
  rows = 3,
  placeholder,
  previewClassName,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  rows?: number;
  placeholder?: string;
  previewClassName?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Edited as it reads by default; the HTML view is there for the markup and long formulas.
  const [mode, setMode] = useState<"visual" | "html">("visual");

  const modeSwitch = (
    <div role="radiogroup" aria-label={`${label} view`} className="ml-auto flex rounded-(--shape-xs) bg-muted p-0.5">
      {(["visual", "html"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => setMode(m)}
          className={cn(
            "h-6 rounded-[calc(var(--shape-xs)-2px)] px-2 text-xs transition-colors duration-(--duration-short)",
            mode === m
              ? "bg-card font-medium text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {m === "visual" ? "Visual" : "HTML"}
        </button>
      ))}
    </div>
  );

  function wrap(before: string, after: string) {
    const area = ref.current;
    if (!area) return;
    const { selectionStart: start, selectionEnd: end } = area;
    onChange(value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end));
    // Put the caret back inside the new tags, around the text that was selected.
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + before.length, end + before.length);
    });
  }

  return (
    <Field id={id} label={label} required={required} hint={hint}>
      <div className="overflow-hidden rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        {mode === "visual" ? (
          <VisualEditor
            id={id}
            label={label}
            value={value}
            onChange={onChange}
            minRows={rows}
            toolbarEnd={modeSwitch}
          />
        ) : (
          <>
            <div
              role="toolbar"
              aria-label={`Format ${label}`}
              className="flex flex-wrap gap-0.5 border-b border-border bg-surface-2 px-1.5 py-1"
            >
              {FORMATS.map((format) => (
                <button
                  key={format.title}
                  type="button"
                  title={format.title}
                  aria-label={format.title}
                  onClick={() => wrap(format.before, format.after)}
                  className={cn(
                    "flex h-7 min-w-7 items-center justify-center rounded-(--shape-xs) px-1.5 text-xs text-muted-foreground transition-colors duration-(--duration-short) hover:bg-primary/(--state-hover) hover:text-foreground",
                    format.className,
                  )}
                >
                  {format.label}
                </button>
              ))}
              {modeSwitch}
            </div>
            <Textarea
              ref={ref}
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={rows}
              placeholder={placeholder}
              className="rounded-none border-0 font-mono text-xs shadow-none focus-visible:ring-0"
            />
          </>
        )}
      </div>
      {value.trim() && (
        <div className={cn("rounded-(--shape-sm) bg-surface-2 px-3 py-2", previewClassName)}>
          <p className="mb-1 text-[11px] font-medium text-muted-foreground">Preview</p>
          <RichContent content={value} />
        </div>
      )}
    </Field>
  );
}
