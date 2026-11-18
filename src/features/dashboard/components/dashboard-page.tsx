"use client";

import { LayoutDashboard } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page-shell";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Users, subscriptions, revenue and reports at a glance" />
      <div className="overflow-hidden rounded-(--shape-md) bg-card shadow-sm ring-1 ring-foreground/[0.07]">
        <EmptyState
          icon={<LayoutDashboard className="h-5 w-5" />}
          title="No numbers yet"
          description="Totals appear here once the dashboard API is built."
        />
      </div>
    </div>
  );
}
