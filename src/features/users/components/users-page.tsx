"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { date } from "@/lib/format";
import { useAcademicGroups, useEducationLevels } from "@/lib/lookups";
import { USERS, userKeys } from "@/features/users/api";
import { useCrudList } from "@/hooks/use-crud-list";
import { useUrlState } from "@/hooks/use-url-state";
import { Badge } from "@/components/ui/badge";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { Button } from "@/components/ui/button";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, PageHeader, SearchInput } from "@/components/shared/page-shell";
import { RowActions } from "@/components/shared/row-actions";
import type { User } from "@/features/users/types";

/** The fixed choices of the status filter, each a set of query params. */
const STATUSES: { id: string; name: string; params: Record<string, string> }[] = [
  { id: "vip", name: "VIP", params: { has_active_subscription: "true" } },
  { id: "free", name: "Free", params: { has_active_subscription: "false" } },
  { id: "not-onboarded", name: "Not onboarded", params: { is_onboarded: "false" } },
  { id: "inactive", name: "Deactivated", params: { is_active: "false" } },
  { id: "staff", name: "Staff", params: { is_staff: "true" } },
];

/** The name an account goes by: its full name, else its mobile. */
export function displayName(user: Pick<User, "full_name" | "mobile">): string {
  return user.full_name || user.mobile || "Unnamed account";
}

export function UsersPage() {
  const levels = useEducationLevels();
  const groups = useAcademicGroups();
  const [level, setLevel] = useUrlState("level");
  const [group, setGroup] = useUrlState("group");
  const [status, setStatus] = useUrlState("status");

  const groupOptions = useMemo(
    () => (level ? groups.data?.filter((g) => String(g.education_level) === level) : groups.data),
    [groups.data, level],
  );

  const { rows, isLoading, isFetching, search, onSearch, setPage, pagination } = useCrudList<User>({
    key: userKeys.all[0],
    path: USERS,
    params: {
      education_level: level,
      academic_group: group,
      ...STATUSES.find((s) => s.id === status)?.params,
    },
  });

  const columns: Column<User>[] = [
    {
      key: "user",
      header: "User",
      cell: (u) => (
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar id={u.id} name={displayName(u)} />
          <div className="min-w-0">
            <Link href={`/users/${u.id}`} className="line-clamp-1 font-medium text-foreground hover:text-primary">
              {displayName(u)}
            </Link>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {[u.full_name ? u.mobile : null, u.email].filter(Boolean).join(" · ") || "Not onboarded yet"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "placement",
      header: "Level and group",
      secondary: true,
      width: "190px",
      cell: (u) =>
        u.education_level_name ? (
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm text-foreground">
              {u.education_level_name} · {u.academic_group_name ?? "No group"}
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{u.batch_name ?? "No batch"}</p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Not onboarded</span>
        ),
    },
    {
      key: "plan",
      header: "Plan",
      width: "150px",
      cell: (u) =>
        u.has_active_subscription ? (
          <div>
            <Badge variant="warning">VIP</Badge>
            {u.subscription_expires_at && (
              <p className="mt-1 text-xs text-muted-foreground">until {date(u.subscription_expires_at)}</p>
            )}
          </div>
        ) : (
          <Badge variant="outline">Free</Badge>
        ),
    },
    {
      key: "joined",
      header: "Joined",
      secondary: true,
      width: "130px",
      cell: (u) => <span className="text-sm text-muted-foreground">{date(u.date_joined)}</span>,
    },
    {
      key: "status",
      header: "Account",
      width: "120px",
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Deactivated</Badge>}
          {u.is_staff && <Badge variant="secondary">Staff</Badge>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "90px",
      cell: (u) => (
        <div className="flex justify-end">
          <RowActions primary={{ label: "Open", href: `/users/${u.id}` }} actions={[]} />
        </div>
      ),
    },
  ];

  const filtered = Boolean(search || level || group || status);

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Everyone with an account; students sign up in the app" />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={onSearch} placeholder="Search name, mobile or email…" />
        <LookupSelect
          ariaLabel="Filter by status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={STATUSES}
          placeholder="All users"
          allLabel="All users"
          className="w-40 bg-card"
        />
        <LookupSelect
          ariaLabel="Filter by education level"
          value={level}
          onChange={(v) => {
            setLevel(v);
            setGroup("");
            setPage(1);
          }}
          options={levels.data}
          placeholder="All levels"
          allLabel="All levels"
          className="w-36 bg-card"
        />
        <LookupSelect
          ariaLabel="Filter by academic group"
          value={group}
          onChange={(v) => {
            setGroup(v);
            setPage(1);
          }}
          options={groupOptions}
          placeholder="All groups"
          allLabel="All groups"
          className="w-40 bg-card"
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(u) => u.id}
        loading={isLoading}
        refreshing={isFetching && !isLoading}
        empty={
          filtered ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="No users match these filters"
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    onSearch("");
                    setLevel("");
                    setGroup("");
                    setStatus("");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              firstRun
              title="No users yet"
              description="Students appear here once they sign up in the app with their mobile number."
            />
          )
        }
      />

      <Pagination {...pagination} />
    </div>
  );
}
