"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  BookMarked,
  BookOpen,
  ChevronDown,
  ClipboardList,
  Flag,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Library,
  LogOut,
  Settings,
  Tags,
  Users2,
} from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** Sidebar navigation. Every signed-in user is an admin, so no item is role-gated; add a screen's link when it ships. */
export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    // Ordered top-down, the way the hierarchy is built: a level, its groups, their subjects, and so on.
    label: "Curriculum",
    items: [
      { title: "Education levels", url: "/curriculum/education-levels", icon: GraduationCap },
      { title: "Academic groups", url: "/curriculum/academic-groups", icon: Layers },
      { title: "Batches", url: "/curriculum/batches", icon: Users2 },
      { title: "Subjects", url: "/curriculum/subjects", icon: BookOpen },
      { title: "Chapters", url: "/curriculum/chapters", icon: BookMarked },
      { title: "Topics", url: "/curriculum/topics", icon: Tags },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Question bank", url: "/question-bank", icon: Library },
      { title: "Reports", url: "/reports", icon: Flag },
    ],
  },
  {
    label: "Exams",
    items: [{ title: "Mock tests", url: "/mock-tests", icon: ClipboardList }],
  },
  {
    label: "More",
    items: [{ title: "Settings", url: "/settings", icon: Settings }],
  },
];

/** Longest match wins, so a nested page lights up only its own item. */
function activeUrl(pathname: string) {
  const all = navGroups.flatMap((g) => g.items.map((i) => i.url));
  return all.filter((url) => pathname === url || pathname.startsWith(url + "/")).sort((a, b) => b.length - a.length)[0];
}

/** `onLogout` ends the session; the layout owns it so the chrome stays feature-free. */
export function AppSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const current = activeUrl(pathname);
  // Groups the admin has folded away; everything starts open.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    // Full height from the top edge: the sidebar is its own column now, not
    // a panel tucked under a full-width header.
    <Sidebar className="border-r border-sidebar-border">
      {/* The brand lives here rather than in the header, so the left column
          reads as one surface from the logo down. */}
      <SidebarHeader className="h-18 shrink-0 justify-center border-b border-sidebar-border px-6 py-0">
        <Link href="/dashboard" className="flex items-baseline gap-2 select-none">
          <span className="text-lg font-semibold tracking-tight text-white">Shomadhan</span>
          <span className="text-xs font-medium text-sidebar-foreground/50">Admin</span>
        </Link>
      </SidebarHeader>

      {/* The nav scrolls on its own so every link stays reachable however
          long the list grows, without the page moving underneath it. */}
      <SidebarContent className="gap-0 overflow-y-auto py-2">
        {navGroups.map((group, groupIndex) => {
          // A lone link gains nothing from folding, so only longer groups get the arrow.
          const foldable = group.items.length > 1;
          const open = !collapsed[group.label];
          const labelClass = `h-auto px-6 pb-1.5 text-[11px] leading-none font-semibold tracking-[0.12em] text-sidebar-foreground/40 uppercase ${
            groupIndex === 0 ? "pt-2" : "pt-5"
          }`;

          return (
            <SidebarGroup key={group.label} className="px-0 py-0">
              {foldable ? (
                <SidebarGroupLabel
                  render={
                    <button
                      type="button"
                      onClick={() => setCollapsed((c) => ({ ...c, [group.label]: open }))}
                      aria-expanded={open}
                    />
                  }
                  className={`${labelClass} w-full cursor-pointer justify-between transition-colors hover:text-sidebar-foreground/75`}
                >
                  {group.label}
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-(--duration-short) ${open ? "" : "-rotate-90"}`}
                  />
                </SidebarGroupLabel>
              ) : (
                <SidebarGroupLabel className={labelClass}>{group.label}</SidebarGroupLabel>
              )}
              {open && (
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0">
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          render={<Link href={item.url} />}
                          isActive={current === item.url}
                          // `data-active:` because the primitive sets a bare attribute; the highlight runs full width.
                          className="relative h-11 gap-3 rounded-none px-6 text-sm text-sidebar-foreground/75 transition-colors before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-sidebar-primary before:opacity-0 before:transition-opacity hover:bg-white/[0.06] hover:text-white data-active:bg-white/[0.09] data-active:font-medium data-active:text-white data-active:before:opacity-100"
                        >
                          <item.icon className="h-[18px] w-[18px] shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* Pinned rather than sitting at the end of the scrolling list, where
          it would drift out of reach as the nav grows. */}
      <SidebarFooter className="shrink-0 border-t border-sidebar-border p-2">
        <button
          onClick={() => onLogout()}
          className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-destructive/20 hover:text-sidebar-foreground"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
