"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { dateTime, money } from "@/lib/format";
import { APPLE_TRANSACTIONS, PAYMENTS, paymentKeys } from "@/features/payments/api";
import { APPLE_STATUSES, PAYMENT_STATUSES, appleStatus, paymentStatus } from "@/features/payments/constants";
import { useCrudList } from "@/hooks/use-crud-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, Pagination, type Column } from "@/components/shared/data-table";
import { DateRange } from "@/components/shared/date-range";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, PageHeader, SearchInput } from "@/components/shared/page-shell";
import { RowActions } from "@/components/shared/row-actions";
import type { AppleTransaction, Payment } from "@/features/payments/types";

type Source = "sslcommerz" | "apple";

const SOURCES: { id: Source; name: string }[] = [
  { id: "sslcommerz", name: "SSLCommerz" },
  { id: "apple", name: "App Store" },
];

/** Who paid, as each table's first column: their name over their mobile, linked to their user page. */
function Payer({ id, name, mobile }: { id: number | null; name: string; mobile: string | null }) {
  if (!id) return <span className="text-sm text-muted-foreground">Deleted account</span>;
  return (
    <div className="min-w-0">
      <Link href={`/users/${id}`} className="line-clamp-1 font-medium text-foreground hover:text-primary">
        {name || mobile}
      </Link>
      {name && <p className="line-clamp-1 text-xs text-muted-foreground">{mobile}</p>}
    </div>
  );
}

/** A plan with its transaction id under it, linked to the payment's page. */
function Purchase({ href, title, reference }: { href: string; title: string; reference: string }) {
  return (
    <div className="min-w-0">
      <Link href={href} className="line-clamp-1 text-sm text-foreground hover:text-primary">
        {title}
      </Link>
      <p className="line-clamp-1 font-mono text-xs text-muted-foreground">{reference}</p>
    </div>
  );
}

type List<T> = ReturnType<typeof useCrudList<T & { id: number }>>;

function SslcommerzTable({ list, filtered }: { list: List<Payment>; filtered: boolean }) {
  const columns: Column<Payment>[] = [
    {
      key: "student",
      header: "Student",
      cell: (p) => <Payer id={p.user} name={p.user_name} mobile={p.user_mobile} />,
    },
    {
      key: "plan",
      header: "Plan",
      width: "220px",
      cell: (p) => <Purchase href={`/billing/payments/${p.id}`} title={p.product_title} reference={p.transaction_id} />,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      width: "120px",
      cell: (p) => (
        <div>
          <p className="text-sm font-medium text-foreground">{money(p.amount)}</p>
          {p.coupon_code && <p className="text-xs text-muted-foreground">{p.coupon_code}</p>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "110px",
      cell: (p) => <Badge variant={paymentStatus(p.status).variant}>{paymentStatus(p.status).name}</Badge>,
    },
    {
      key: "when",
      header: "When",
      secondary: true,
      width: "170px",
      cell: (p) => <span className="text-sm text-muted-foreground">{dateTime(p.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "90px",
      cell: (p) => (
        <div className="flex justify-end">
          <RowActions primary={{ label: "Open", href: `/billing/payments/${p.id}` }} actions={[]} />
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(p) => p.id}
        loading={list.isLoading}
        refreshing={list.isFetching && !list.isLoading}
        empty={
          <EmptyState
            icon={<CreditCard className="h-5 w-5" />}
            title={filtered ? "No payments match these filters" : "No payments yet"}
            description="A row appears when a student starts paying for a plan with SSLCommerz."
          />
        }
      />
      <Pagination {...list.pagination} />
    </>
  );
}

function AppleTable({ list, filtered }: { list: List<AppleTransaction>; filtered: boolean }) {
  const columns: Column<AppleTransaction>[] = [
    {
      key: "student",
      header: "Student",
      cell: (t) => <Payer id={t.user} name={t.user_name} mobile={t.user_mobile} />,
    },
    {
      key: "plan",
      header: "Plan",
      width: "220px",
      cell: (t) => (
        <Purchase
          href={`/billing/payments/apple/${t.id}`}
          title={t.product_title ?? t.apple_product_id}
          reference={t.original_transaction_id}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "150px",
      cell: (t) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={appleStatus(t.status).variant}>{appleStatus(t.status).name}</Badge>
          {t.environment === "Sandbox" && <Badge variant="outline">Sandbox</Badge>}
        </div>
      ),
    },
    {
      key: "when",
      header: "Bought",
      secondary: true,
      width: "170px",
      cell: (t) => <span className="text-sm text-muted-foreground">{dateTime(t.purchase_date)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "90px",
      cell: (t) => (
        <div className="flex justify-end">
          <RowActions primary={{ label: "Open", href: `/billing/payments/apple/${t.id}` }} actions={[]} />
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(t) => t.id}
        loading={list.isLoading}
        refreshing={list.isFetching && !list.isLoading}
        empty={
          <EmptyState
            icon={<CreditCard className="h-5 w-5" />}
            title={filtered ? "No purchases match these filters" : "No App Store purchases yet"}
            description="A row appears when an iPhone purchase has been verified with Apple."
          />
        }
      />
      <Pagination {...list.pagination} />
    </>
  );
}

/** `/billing/payments`: every payment attempt, from SSLCommerz or the App Store. Read-only. */
export function PaymentsPage() {
  const [source, setSource] = useState<Source>("sslcommerz");
  const [status, setStatus] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });
  const statuses = source === "apple" ? APPLE_STATUSES : PAYMENT_STATUSES;

  // One list per source, each fetching only while its tab is showing.
  const payments = useCrudList<Payment>({
    key: paymentKeys.all[0],
    path: PAYMENTS,
    params: { status, created_at__date__gte: range.from, created_at__date__lte: range.to },
    enabled: source === "sslcommerz",
  });
  const purchases = useCrudList<AppleTransaction>({
    key: paymentKeys.apple[0],
    path: APPLE_TRANSACTIONS,
    params: { status, purchase_date__date__gte: range.from, purchase_date__date__lte: range.to },
    enabled: source === "apple",
  });
  const list = source === "apple" ? purchases : payments;
  const filtered = Boolean(list.search || status || range.from || range.to);

  /** Filters change what page 1 is, so every change starts there. */
  function filter(change: () => void) {
    change();
    payments.setPage(1);
    purchases.setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Every payment attempt; the gateway decides its status, so nothing here is editable"
      >
        <div
          role="tablist"
          aria-label="Payment source"
          className="inline-flex rounded-(--shape-sm) border border-border bg-card p-0.5"
        >
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={source === s.id}
              onClick={() => {
                setSource(s.id);
                // The two sources use different status values.
                filter(() => setStatus(""));
              }}
              className={cn(
                "h-8 rounded-[calc(var(--shape-sm)-2px)] px-3 text-sm transition-colors duration-(--duration-short)",
                source === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={list.search}
          onChange={list.onSearch}
          placeholder={
            source === "apple" ? "Search transaction id or mobile…" : "Search transaction id, name or mobile…"
          }
        />
        <LookupSelect
          ariaLabel="Filter by status"
          value={status}
          onChange={(v) => filter(() => setStatus(v))}
          options={statuses}
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

      {source === "sslcommerz" ? (
        <SslcommerzTable list={payments} filtered={filtered} />
      ) : (
        <AppleTable list={purchases} filtered={filtered} />
      )}
    </div>
  );
}
