"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ShoppingCart, UserPlus, Users } from "lucide-react";
import { money } from "@/lib/format";
import { dashboardApi, dashboardKeys } from "@/features/dashboard/api";
import { PageHeader } from "@/components/shared/page-shell";
import { SmsCreditCard } from "./sms-credit-card";
import { TrendCharts } from "./trend-charts";
import { StatTile, compact } from "./stat-tile";

/** A card that opens the page behind its number. */
function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block h-full rounded-(--shape-md) focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {children}
    </Link>
  );
}

/** `/dashboard`: users, VIP, today's purchases and the SMS credit, which turns red when low. */
export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: dashboardApi.summary,
    refetchInterval: 60_000,
  });
  const loading = isLoading || !data;
  const purchases = data?.purchases_today;

  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" description="Users, VIP, today's purchases and the SMS credit at a glance" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <CardLink href="/users">
          <StatTile
            size="sm"
            label="Total users"
            value={data?.users.total ?? 0}
            context={data && `${compact(data.users.onboarded)} onboarded`}
            icon={<Users className="h-4 w-4" />}
            accent={1}
            loading={loading}
          />
        </CardLink>
        <CardLink href="/users">
          <StatTile
            size="sm"
            label="New users today"
            value={data?.users.new_today ?? 0}
            context={data && `${compact(data.users.new_this_week)} in the last 7 days`}
            icon={<UserPlus className="h-4 w-4" />}
            accent={2}
            loading={loading}
          />
        </CardLink>
        <CardLink href="/billing/subscriptions">
          <StatTile
            size="sm"
            label="Active VIP users"
            value={data?.vip.active ?? 0}
            context={
              data &&
              (data.vip.expiring_this_week
                ? `${data.vip.expiring_this_week} lapse within 7 days`
                : "None lapse within 7 days")
            }
            icon={<BadgeCheck className="h-4 w-4" />}
            accent={3}
            loading={loading}
          />
        </CardLink>
        <CardLink href="/billing/payments">
          <StatTile
            size="sm"
            label="Purchases today"
            value={purchases?.count ?? 0}
            context={
              purchases &&
              [`${money(purchases.amount)} paid`, purchases.app_store && `${purchases.app_store} App Store`]
                .filter(Boolean)
                .join(" · ")
            }
            icon={<ShoppingCart className="h-4 w-4" />}
            accent={4}
            loading={loading}
          />
        </CardLink>
        <SmsCreditCard />
      </div>

      <TrendCharts />
    </div>
  );
}
