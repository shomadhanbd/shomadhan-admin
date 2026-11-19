"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser } from "@/lib/session";
import { useHydrated } from "@/hooks/use-hydrated";
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
  BadgeCheck,
  CreditCard,
  Flag,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Library,
  LogOut,
  MessageSquareText,
  Package,
  Settings,
  Tags,
  TicketPercent,
  Users,
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
    label: "People",
    items: [
      { title: "Users", url: "/users", icon: Users },
      { title: "OTP log", url: "/otp-log", icon: MessageSquareText },
    ],
  },
  {
    label: "Billing",
    items: [
      { title: "Plans", url: "/billing/products", icon: Package },
      { title: "Coupons", url: "/billing/coupons", icon: TicketPercent },
      { title: "Payments", url: "/billing/payments", icon: CreditCard },
      { title: "Subscriptions", url: "/billing/subscriptions", icon: BadgeCheck },
    ],
  },
  {
    // Below the daily work: the curriculum is set up once and rarely changes.
    // Its links run top-down, the way the hierarchy is built: a level, its groups, their subjects, and so on.
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
    label: "More",
    items: [{ title: "Settings", url: "/settings", icon: Settings }],
  },
];

/** Longest match wins, so a nested page lights up only its own item. */
function activeUrl(pathname: string) {
  const all = navGroups.flatMap((g) => g.items.map((i) => i.url));
  return all.filter((url) => pathname === url || pathname.startsWith(url + "/")).sort((a, b) => b.length - a.length)[0];
}

/** The student app's logo on a white tile, as on its launcher icon. */
export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-(--shape-sm) bg-white shadow-sm ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed 18KB logo; nothing to optimise. */}
      <img src="/shomadhan-logo.png" alt="" className="h-[78%] w-[78%]" />
    </span>
  );
}

/** `onLogout` ends the session; the layout owns it so the chrome stays feature-free. */
export function AppSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const current = activeUrl(pathname);
  // Groups the admin has folded away; everything starts open.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  // The stored user lives in localStorage, which only the browser can read.
  const user = useHydrated() ? getUser() : null;
  const name = user?.full_name || user?.mobile || "Admin";

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="h-18 shrink-0 justify-center px-5 py-0">
        <Link href="/dashboard" className="flex items-center gap-3 select-none">
          <BrandMark />
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold tracking-tight text-white">Shomadhan</span>
            <span className="text-xs text-sidebar-foreground/70">Admin panel</span>
          </span>
        </Link>
      </SidebarHeader>

      {/* The nav scrolls on its own so every link stays reachable however long the list grows. */}
      <SidebarContent className="gap-0 overflow-y-auto px-3 pt-1 pb-3">
        {navGroups.map((group, groupIndex) => {
          // A lone link gains nothing from folding, so only longer groups get the arrow.
          const foldable = group.items.length > 1;
          const open = !collapsed[group.label];
          const labelClass = `h-auto px-3 pb-1.5 text-xs font-medium text-sidebar-foreground/55 ${
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
                  className={`${labelClass} w-full cursor-pointer justify-between transition-colors hover:text-sidebar-foreground`}
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
                  <SidebarMenu className="gap-0.5">
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          render={<Link href={item.url} />}
                          isActive={current === item.url}
                          // The active item takes the app's selected-pill gradient.
                          className="h-10 gap-3 rounded-(--shape-sm) px-3 text-sm text-sidebar-foreground transition-colors duration-(--duration-short) hover:bg-sidebar-accent hover:text-white data-active:bg-brand data-active:font-semibold data-active:text-white data-active:shadow-[0_6px_16px_rgb(6_119_125/0.35)]"
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

      {/* Pinned, so the signed-in admin and Logout never scroll out of reach. */}
      <SidebarFooter className="shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-(--shape-sm) bg-sidebar-accent px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
            {name.replace(/^\+/, "").charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-medium text-white">{name}</span>
            <span className="block truncate text-xs text-sidebar-foreground/70">{user?.mobile ?? "Signed in"}</span>
          </span>
          <button
            type="button"
            onClick={() => onLogout()}
            aria-label="Logout"
            title="Logout"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-(--shape-xs) text-sidebar-foreground transition-colors hover:bg-destructive/20 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
