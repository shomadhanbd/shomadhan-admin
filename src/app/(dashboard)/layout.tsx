"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { isAuthenticated } from "@/lib/session";
import { useHydrated } from "@/hooks/use-hydrated";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { LeaveGuard } from "@/components/layout/leave-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logout = useLogout();
  // The token is in localStorage, so whether anyone is signed in is unknown until hydration.
  const hydrated = useHydrated();
  const signedIn = hydrated && isAuthenticated();

  useEffect(() => {
    if (hydrated && !signedIn) router.replace("/login");
  }, [hydrated, signedIn, router]);

  // The sidebar owns the left column; the header belongs to the content column.
  return (
    <SidebarProvider>
      {/* Skip link so keyboard users can bypass the sidebar. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-(--shape-sm) focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>
      <AppSidebar onLogout={logout} />
      <SidebarInset className="min-w-0 bg-background">
        <TopHeader onLogout={logout} />
        {/* Responsive padding; not keyed on the path, so shared layouts stay mounted between pages. */}
        <div id="main-content" tabIndex={-1} className="flex-1 p-4 focus:outline-none sm:p-6 lg:p-8">
          {/* Mounted only once someone is signed in, so a page about to redirect fires no requests. */}
          {signedIn ? children : null}
        </div>
      </SidebarInset>
      <LeaveGuard />
    </SidebarProvider>
  );
}
