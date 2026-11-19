"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Sigma,
  Subscript as SubIcon,
  Superscript as SupIcon,
  Underline,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** The delimiters the mobile app typesets, `$$…$$` before `$…$` so it is not read as two. */
const FORMULA = /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$/g;

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unescape = (text: string) => text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/**
 * Stored content into the editor. A formula's `<` or `&` would otherwise be read as markup;
 * escaped, it loads as the text it is.
 */
function toEditor(stored: string): string {
  return stored.replace(FORMULA, (formula) => escape(formula));
}

/**
 * The editor's HTML back into stored content: `<b>`/`<i>` as the app expects, and formulas
 * unescaped again, since the app reads them exactly as typed.
 */
function toStored(html: string): string {
  if (html === "<p></p>") return "";
  return html
    .replace(/<(\/?)strong>/g, "<$1b>")
    .replace(/<(\/?)em>/g, "<$1i>")
    .replace(FORMULA, (formula) => unescape(formula));
}

const EXTENSIONS = [
  // Only what the app renders: paragraphs, line breaks, lists and the five marks.
  StarterKit.configure({
    heading: false,
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    link: false,
  }),
  Subscript,
  Superscript,
];

/** Question content edited as it reads, with the app's formats; formulas stay as typed text. */
export function VisualEditor({
  id,
  value,
  onChange,
  minRows = 3,
  label,
  toolbarEnd,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
  label: string;
  /** Shown at the right of the toolbar, e.g. the switch to the HTML view. */
  toolbarEnd?: React.ReactNode;
}) {
  // What this editor last handed up, so a change made here is not loaded back in.
  const emitted = useRef(value);

  const editor = useEditor({
    extensions: EXTENSIONS,
    content: toEditor(value),
    // The page renders on the server first; the editor exists only in the browser.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id,
        "aria-label": label,
        class: "outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const stored = toStored(editor.getHTML());
      emitted.current = stored;
      onChange(stored);
    },
  });

  // Loaded or reset from outside (another mode, a discarded draft): show the new content.
  useEffect(() => {
    if (!editor || value === emitted.current) return;
    emitted.current = value;
    editor.commands.setContent(toEditor(value), { emitUpdate: false });
  }, [editor, value]);

  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      underline: editor?.isActive("underline") ?? false,
      superscript: editor?.isActive("superscript") ?? false,
      subscript: editor?.isActive("subscript") ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
    }),
  });

  const tools = [
    { title: "Bold", icon: Bold, on: active?.bold, run: () => editor?.chain().focus().toggleBold().run() },
    { title: "Italic", icon: Italic, on: active?.italic, run: () => editor?.chain().focus().toggleItalic().run() },
    {
      title: "Underline",
      icon: Underline,
      on: active?.underline,
      run: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      title: "Superscript",
      icon: SupIcon,
      on: active?.superscript,
      run: () => editor?.chain().focus().toggleSuperscript().run(),
    },
    {
      title: "Subscript",
      icon: SubIcon,
      on: active?.subscript,
      run: () => editor?.chain().focus().toggleSubscript().run(),
    },
    {
      title: "Bullet list",
      icon: List,
      on: active?.bulletList,
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      title: "Numbered list",
      icon: ListOrdered,
      on: active?.orderedList,
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      title: "Inline maths: wraps the selection in $…$",
      icon: Sigma,
      on: false,
      run: () => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        const selected = editor.state.doc.textBetween(from, to);
        editor.chain().focus().insertContentAt({ from, to }, `$${selected}$`).run();
      },
    },
  ];

  return (
    <>
      <div
        role="toolbar"
        aria-label={`Format ${label}`}
        className="flex flex-wrap gap-0.5 border-b border-border bg-surface-2 px-1.5 py-1"
      >
        {tools.map(({ title, icon: Icon, on, run }) => (
          <button
            key={title}
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={on}
            onClick={run}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-(--shape-xs) text-muted-foreground transition-colors duration-(--duration-short) hover:bg-accent hover:text-foreground",
              on && "bg-accent text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
        {toolbarEnd}
      </div>
      <EditorContent
        editor={editor}
        style={{ minHeight: `${minRows * 1.6 + 1}rem` }}
        className="bg-card px-3 py-2 text-sm text-foreground [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </>
  );
}
