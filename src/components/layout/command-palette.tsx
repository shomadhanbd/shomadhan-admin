"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { navGroups } from "./app-sidebar";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { whenSafeToLeave } from "@/hooks/use-leave-warning";

interface Result {
  id: string;
  label: string;
  hint?: string;
  group: string;
  href: string;
  icon: React.ReactNode;
}

const PAGES: Result[] = navGroups.flatMap((g) =>
  g.items.map((i) => {
    const Icon = i.icon;
    return {
      id: `page:${i.url}`,
      label: i.title,
      group: "Pages",
      hint: g.label,
      href: i.url,
      icon: <Icon className="h-4 w-4" />,
    };
  }),
);

/** Jump to any screen from anywhere. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? PAGES.filter((p) => p.label.toLowerCase().includes(q) || p.hint?.toLowerCase().includes(q)) : PAGES;
  }, [query]);

  // Clamped during render rather than reset from an effect: the result set
  // shrinks as you type, and an effect would leave one frame pointing past
  // the end of the list.
  const activeIndex = Math.min(active, Math.max(0, results.length - 1));

  function close() {
    setQuery("");
    setActive(0);
    onOpenChange(false);
  }

  function go(r: Result | undefined) {
    if (!r) return;
    close();
    whenSafeToLeave(() => router.push(r.href));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[activeIndex]);
    }
  }

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent showCloseButton={false} className="top-24 translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Jump to a page</DialogTitle>
        <DialogDescription className="sr-only">Type a page name, then press Enter to open it.</DialogDescription>

        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a page…"
            aria-label="Jump to a page"
            autoFocus
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <ul ref={listRef} className="max-h-80 overflow-y-auto p-2" role="listbox">
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">Nothing matches “{query}”</li>
          )}
          {results.map((r, i) => {
            const header = i === 0 || results[i - 1].group !== r.group ? r.group : null;
            return (
              <li key={r.id}>
                {header && <p className="px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground">{header}</p>}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === activeIndex}
                  data-active={i === activeIndex}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                  className={`flex w-full items-center gap-3 rounded-(--shape-sm) px-3 py-2 text-left transition-colors duration-(--duration-short) ${
                    i === activeIndex ? "bg-primary-surface text-primary" : "text-foreground"
                  }`}
                >
                  <span className={i === activeIndex ? "text-primary" : "text-muted-foreground"}>{r.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.label}</span>
                    {r.hint && <span className="block truncate text-xs text-muted-foreground">{r.hint}</span>}
                  </span>
                  {i === activeIndex && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 opacity-60" />}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border px-1.5 py-0.5 font-sans">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border px-1.5 py-0.5 font-sans">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border px-1.5 py-0.5 font-sans">esc</kbd>
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
