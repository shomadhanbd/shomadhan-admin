"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Lock, MessageSquareOff, MessageSquareText, ShieldCheck } from "lucide-react";
import { dateTime } from "@/lib/format";
import { OTP_REQUESTS, otpApi, otpKeys } from "@/features/otp-log/api";
import { OTP_STATUSES, otpStatus } from "@/features/otp-log/constants";
import { StatTile } from "@/features/dashboard/components/stat-tile";
import { useCrudList } from "@/hooks/use-crud-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { DateRange } from "@/components/shared/date-range";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, PageHeader, SearchInput } from "@/components/shared/page-shell";
import type { OtpRequest } from "@/features/otp-log/types";

/** `/otp-log`: every OTP SMS sent, for spotting abuse, SMS spend and students stuck at sign-in. Read-only. */
export function OtpLogPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  // The dashboard links here as `?status=not_sent`.
  const initial = use(searchParams).status;
  const [status, setStatus] = useState(OTP_STATUSES.some((s) => s.id === initial) ? initial! : "");
  const [range, setRange] = useState({ from: "", to: "" });

  const summary = useQuery({ queryKey: otpKeys.summary, queryFn: otpApi.summary, refetchInterval: 60_000 });
  const list = useCrudList<OtpRequest>({
    key: otpKeys.all[0],
    path: OTP_REQUESTS,
    params: { status, created_at__date__gte: range.from, created_at__date__lte: range.to },
  });
  const filtered = Boolean(list.search || status || range.from || range.to);

  function filter(change: () => void) {
    change();
    list.setPage(1);
  }

  const s = summary.data;
  const rate = s && s.sent ? Math.round((s.verified / s.sent) * 100) : null;

  const columns: Column<OtpRequest>[] = [
    {
      key: "mobile",
      header: "Mobile",
      cell: (o) => (
        <div className="min-w-0">
          <p className="font-mono text-sm font-medium text-foreground">{o.mobile}</p>
          {o.user ? (
            <Link href={`/users/${o.user}`} className="line-clamp-1 text-xs text-primary hover:underline">
              {o.user_name || "Account (no name yet)"}
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground">No account yet</p>
          )}
        </div>
      ),
    },
    {
      key: "ip",
      header: "IP",
      secondary: true,
      width: "150px",
      cell: (o) => (
        <button
          type="button"
          title="Show every code from this IP"
          onClick={() => o.request_ip && filter(() => list.onSearch(o.request_ip!))}
          className="font-mono text-xs text-muted-foreground hover:text-primary"
        >
          {o.request_ip ?? "Unknown"}
        </button>
      ),
    },
    {
      key: "sent",
      header: "Sent",
      width: "180px",
      cell: (o) => <span className="text-sm text-foreground">{dateTime(o.created_at)}</span>,
    },
    {
      key: "tries",
      header: "Wrong codes",
      align: "right",
      width: "120px",
      cell: (o) => (
        <span className={o.wrong_tries ? "text-sm text-foreground tabular-nums" : "text-sm text-muted-foreground"}>
          {o.wrong_tries}
          <span className="text-muted-foreground"> / {o.max_attempts}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "150px",
      cell: (o) => {
        const st = otpStatus(o.status);
        return (
          <div className="min-w-0" title={o.sms_error || st.hint}>
            <Badge variant={st.variant}>{st.name}</Badge>
            {o.sms_error && <p className="mt-1 line-clamp-2 text-xs text-destructive">{o.sms_error}</p>}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="OTP log"
        description="Every verification SMS sent. Codes are never stored, and sends refused by the rate limit are not listed"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Codes sent"
          value={s?.sent ?? 0}
          context="Last 24 hours, one SMS each"
          icon={<MessageSquareText className="h-4 w-4" />}
          accent={1}
          loading={summary.isLoading}
        />
        <StatTile
          label="Verified"
          value={s?.verified ?? 0}
          context={rate == null ? "Last 24 hours" : `${rate}% of codes sent in the last 24 hours`}
          icon={<ShieldCheck className="h-4 w-4" />}
          accent={2}
          loading={summary.isLoading}
        />
        <StatTile
          label="Locked out"
          value={s?.locked ?? 0}
          context="Too many wrong codes, last 24 hours"
          icon={<Lock className="h-4 w-4" />}
          accent={3}
          loading={summary.isLoading}
        />
        <StatTile
          label="Not sent"
          value={s?.not_sent ?? 0}
          context={s?.last_failure ? `Last: ${s.last_failure.reason}` : "Refused by BulkSMSBD, last 24 hours"}
          icon={<MessageSquareOff className="h-4 w-4" />}
          accent={4}
          loading={summary.isLoading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={list.search} onChange={list.onSearch} placeholder="Search mobile or IP…" />
        <LookupSelect
          ariaLabel="Filter by status"
          value={status}
          onChange={(v) => filter(() => setStatus(v))}
          options={OTP_STATUSES}
          placeholder="All statuses"
          allLabel="All statuses"
          className="w-36 bg-card"
        />
        <DateRange from={range.from} to={range.to} onChange={(r) => filter(() => setRange(r))} />
        {filtered && (
          <Button
            variant="ghost"
            onClick={() =>
              filter(() => {
                list.onSearch("");
                setStatus("");
                setRange({ from: "", to: "" });
              })
            }
          >
            Clear
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(o) => o.id}
        loading={list.isLoading}
        refreshing={list.isFetching && !list.isLoading}
        empty={
          <EmptyState
            icon={<MessageSquareText className="h-5 w-5" />}
            title={filtered ? "No codes match these filters" : "No codes sent yet"}
            description="A row appears each time a student is sent a verification code."
          />
        }
      />
      <Pagination {...list.pagination} />
    </div>
  );
}
