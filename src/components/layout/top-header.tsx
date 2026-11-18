"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, ChevronRight, LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { getUser } from "@/lib/session";
import { useHydrated } from "@/hooks/use-hydrated";
import { CommandPalette } from "./command-palette";
import { navGroups } from "./app-sidebar";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();

  // Rendered as a same-size placeholder until hydrated: the resolved theme is
  // not known during SSR, and swapping in the button afterwards would shift
  // everything beside it.
  if (!hydrated) return <div className="h-9 w-9 shrink-0" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

/** Every destination the sidebar offers, for resolving a bare first crumb. */
const NAV_URLS: string[] = navGroups.flatMap((g) => g.items.map((i) => i.url));

/** Path segments whose crumb should not simply be the segment with its dashes removed. */
const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  settings: "Settings",
};

/** Breadcrumb from the path, with numeric ids dropped. */
function useCrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // A bare first segment resolves to the sidebar's URL; anything else stays unlinked.
  const crumbs: { label: string; href: string | null }[] = [];
  segments.forEach((seg, i) => {
    if (/^\d+$/.test(seg)) return;
    const label = TITLES[seg] ?? seg.replace(/-/g, " ");
    if (crumbs.length && crumbs[crumbs.length - 1].label === label) return;

    const path = "/" + segments.slice(0, i + 1).join("/");
    const href = i > 0 ? path : (NAV_URLS.find((u) => u === path || u.startsWith(path)) ?? null);
    crumbs.push({ label, href });
  });
  return crumbs;
}

export function TopHeader({ onLogout }: { onLogout: () => void }) {
  const { toggleSidebar } = useSidebar();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const crumbs = useCrumbs();

  // `getUser()` reads localStorage, which the server cannot see, so it is only
  // consulted once hydration has matched the SSR markup.
  const user = hydrated ? getUser() : null;
  // An account may have no name set; the mobile number is the one thing every account has.
  const name = user?.full_name || user?.mobile || "Admin";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = name.replace(/^\+/, "").charAt(0).toUpperCase();

  return (
    // Sticky header for the content column; height and padding line up with the sidebar brand bar and the page below.
    <header className="sticky top-0 z-40 flex h-18 shrink-0 items-center gap-3 border-b border-border bg-card px-4 sm:px-6 lg:px-8">
      {/* Pulled left by half the button's own padding so the glyph -- not the
          invisible hit area around it -- lands on the page's left margin. */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 md:flex">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
              {last || !c.href ? (
                <span
                  aria-current={last ? "page" : undefined}
                  className={
                    last
                      ? "truncate text-sm font-medium text-foreground capitalize"
                      : "truncate text-sm text-muted-foreground capitalize"
                  }
                >
                  {c.label}
                </span>
              ) : (
                <Link
                  href={c.href}
                  className="truncate rounded-(--shape-xs) px-1 py-0.5 text-sm text-muted-foreground capitalize transition-colors duration-(--duration-short) hover:bg-accent hover:text-foreground"
                >
                  {c.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <div className="ml-auto flex min-w-0 flex-1 justify-end lg:justify-center">
        <button
          onClick={() => setPaletteOpen(true)}
          aria-label="Search screens"
          className="flex h-9 w-9 items-center justify-center rounded-(--shape-sm) text-muted-foreground transition-colors duration-(--duration-short) hover:bg-accent hover:text-foreground lg:h-9 lg:w-full lg:max-w-sm lg:justify-start lg:gap-2 lg:border lg:border-border lg:bg-background lg:px-3"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="hidden flex-1 text-left text-sm lg:inline">Search…</span>
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-sans text-[11px] text-muted-foreground lg:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="relative flex shrink-0 items-center gap-1" ref={dropdownRef}>
        <ThemeToggle />
        <span aria-hidden className="mx-1 h-5 w-px bg-border" />

        {/* The account block lives only here, so the name sits next to the
            avatar rather than only inside the dropdown -- it is the one place
            identifying who is signed in. */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Account menu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-accent"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium text-foreground sm:inline">
            {user?.first_name || name}
          </span>
          <ChevronDown className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
        </button>

        {open && (
          <div className="absolute top-12 right-0 z-50 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
            <div className="flex items-center gap-3 border-b border-border p-4">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-popover-foreground">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.mobile ?? user?.email ?? ""}</p>
                <span className="mt-1.5 inline-block rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  Admin
                </span>
              </div>
            </div>
            <button
              onClick={() => onLogout()}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        )}
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
