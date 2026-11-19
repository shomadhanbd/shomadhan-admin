"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Pencil, Plus } from "lucide-react";
import { date } from "@/lib/format";
import { SUBSCRIPTIONS, subscriptionKeys } from "@/features/subscriptions/api";
import {
  SUBSCRIPTION_SOURCES,
  SUBSCRIPTION_STATUSES,
  subscriptionSource,
  subscriptionStatus,
} from "@/features/subscriptions/constants";
import { useCrudList } from "@/hooks/use-crud-list";
import { useUrlState } from "@/hooks/use-url-state";
import { Badge } from "@/components/ui/badge";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { Button } from "@/components/ui/button";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, ListToolbar, PageHeader, SearchInput } from "@/components/shared/page-shell";
import { RowActions } from "@/components/shared/row-actions";
import type { Subscription } from "@/features/subscriptions/types";
import { EditSubscriptionDialog, GrantDialog } from "./subscription-dialogs";

/** Where a subscription came from, linked to the payment behind it when there is one. */
function Source({ subscription: s }: { subscription: Subscription }) {
  const href = s.payment
    ? `/billing/payments/${s.payment}`
    : s.apple_transaction
      ? `/billing/payments/apple/${s.apple_transaction}`
      : null;
  return (
    <div className="min-w-0">
      {href ? (
        <Link href={href} className="text-sm text-foreground hover:text-primary">
          {subscriptionSource(s.source)}
        </Link>
      ) : (
        <p className="text-sm text-foreground">{subscriptionSource(s.source)}</p>
      )}
      {(s.note || s.granted_by_name) && (
        <p className="line-clamp-1 text-xs text-muted-foreground" title={s.note}>
          {[s.granted_by_name && `by ${s.granted_by_name}`, s.note].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}

/** `/billing/subscriptions`: who has VIP and until when, with granting, extending and revoking by hand. */
export function SubscriptionsPage() {
  const [status, setStatus] = useUrlState("status", "active");
  const [source, setSource] = useUrlState("source");
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [granting, setGranting] = useState(false);

  const { rows, isLoading, isFetching, search, onSearch, setPage, pagination, total, sort, onSort } =
    useCrudList<Subscription>({
      key: subscriptionKeys.all[0],
      path: SUBSCRIPTIONS,
      params: { status, source },
    });

  const columns: Column<Subscription>[] = [
    {
      key: "student",
      header: "Student",
      cell: (s) => (
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar id={s.user} name={s.user_name || s.user_mobile || ""} />
          <div className="min-w-0">
            <Link href={`/users/${s.user}`} className="line-clamp-1 font-medium text-foreground hover:text-primary">
              {s.user_name || s.user_mobile}
            </Link>
            {s.user_name && <p className="line-clamp-1 text-xs text-muted-foreground">{s.user_mobile}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      width: "160px",
      cell: (s) => <span className="line-clamp-1 text-sm text-foreground">{s.product_title}</span>,
    },
    {
      key: "period",
      header: "VIP until",
      sortKey: "expires_at",
      width: "150px",
      cell: (s) => (
        <div>
          <p className="text-sm text-foreground">{date(s.expires_at)}</p>
          <p className="text-xs text-muted-foreground">from {date(s.starts_at)}</p>
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      secondary: true,
      width: "240px",
      cell: (s) => <Source subscription={s} />,
    },
    {
      key: "status",
      header: "Status",
      width: "110px",
      cell: (s) => <Badge variant={subscriptionStatus(s.status).variant}>{subscriptionStatus(s.status).name}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "70px",
      cell: (s) => (
        <div className="flex justify-end">
          <RowActions
            actions={[
              {
                icon: <Pencil className="h-4 w-4" />,
                label: `Change ${s.user_name || s.user_mobile}'s subscription`,
                onClick: () => setEditing(s),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  // Active VIP is the default view, so only a change from it counts as filtering.
  const filtered = Boolean(search || status !== "active" || source);

  function clearFilters() {
    onSearch("");
    setStatus("active");
    setSource("");
  }
  const grantButton = (size?: "lg") => (
    <Button size={size} onClick={() => setGranting(true)}>
      <Plus className="h-4 w-4" />
      Grant VIP
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" description="Who has VIP and until when, whether bought or granted by hand">
        {grantButton("lg")}
      </PageHeader>

      <ListToolbar
        total={isLoading ? undefined : total}
        noun="subscriptions"
        filtered={filtered}
        onClear={clearFilters}
      >
        <SearchInput value={search} onChange={onSearch} placeholder="Search name or mobile…" />
        <LookupSelect
          ariaLabel="Filter by status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={SUBSCRIPTION_STATUSES}
          placeholder="All statuses"
          allLabel="All statuses"
          className="w-36 bg-card"
        />
        <LookupSelect
          ariaLabel="Filter by source"
          value={source}
          onChange={(v) => {
            setSource(v);
            setPage(1);
          }}
          options={SUBSCRIPTION_SOURCES}
          placeholder="All sources"
          allLabel="All sources"
          className="w-44 bg-card"
        />
      </ListToolbar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(s) => s.id}
        sort={sort}
        onSort={onSort}
        onRowClick={setEditing}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          <EmptyState
            icon={<BadgeCheck className="h-5 w-5" />}
            title={filtered ? "No subscriptions match these filters" : "No subscriptions yet"}
            description="A subscription appears when a student pays for a plan, or when you grant VIP by hand."
            action={
              filtered ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                grantButton()
              )
            }
          />
        }
      />

      <Pagination {...pagination} />

      {granting && <GrantDialog onOpenChange={(o) => !o && setGranting(false)} />}
      {editing && (
        <EditSubscriptionDialog key={editing.id} subscription={editing} onOpenChange={(o) => !o && setEditing(null)} />
      )}
    </div>
  );
}
