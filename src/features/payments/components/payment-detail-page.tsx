"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { date, dateTime, money } from "@/lib/format";
import { paymentKeys, paymentsApi } from "@/features/payments/api";
import { paymentStatus } from "@/features/payments/constants";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, ViewRow } from "@/components/shared/edit-card";
import { EmptyState, PageHeader } from "@/components/shared/page-shell";

export const CARD = "rounded-(--shape-md) surface";

export function Card({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={CARD}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {aside}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

/** The gateway's own record, as sent, for checking a disputed payment against what SSLCommerz or Apple said. */
export function RawRecord({ title, record }: { title: string; record: Record<string, unknown> }) {
  return (
    <Card title={title}>
      {Object.keys(record).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing was received.</p>
      ) : (
        <pre className="max-h-[32rem] overflow-auto rounded-(--shape-sm) bg-surface-2 p-3 font-mono text-xs leading-relaxed text-foreground">
          {JSON.stringify(record, null, 2)}
        </pre>
      )}
    </Card>
  );
}

export function NotFound({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} backHref="/billing/payments" />
      <div className={CARD}>
        <EmptyState icon={<CreditCard className="h-5 w-5" />} title="This payment could not be found" />
      </div>
    </div>
  );
}

export const Loading = () => (
  <div className="space-y-6">
    <Skeleton className="h-12 w-80" />
    <Skeleton className="h-64 rounded-(--shape-md)" />
  </div>
);

/** `/billing/payments/{id}`: one SSLCommerz payment, what it bought, and the subscription it granted. */
export function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: payment, isLoading } = useQuery({
    queryKey: [...paymentKeys.all, "detail", Number(id)],
    queryFn: () => paymentsApi.get(Number(id)),
  });

  if (isLoading) return <Loading />;
  if (!payment) return <NotFound title="Payment" />;

  const status = paymentStatus(payment.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${money(payment.amount)} for ${payment.product_title}`}
        description={payment.transaction_id}
        backHref="/billing/payments"
      >
        <Badge variant={status.variant}>{status.name}</Badge>
      </PageHeader>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <Card title="Payment">
            <dl className="divide-y divide-border">
              <ViewRow label="Plan">
                {payment.product_title} · {payment.granted_months} {payment.granted_months === 1 ? "month" : "months"}
              </ViewRow>
              <ViewRow label="Price">{money(payment.original_price)}</ViewRow>
              <ViewRow label="Discount">
                {payment.discount_amount
                  ? `${money(payment.discount_amount)} with ${payment.coupon_code ?? "a deleted coupon"}`
                  : "None"}
              </ViewRow>
              <ViewRow label="Charged">{money(payment.amount)}</ViewRow>
              <ViewRow label="Checkout opened">{dateTime(payment.created_at)}</ViewRow>
              <ViewRow label="Completed">{dateTime(payment.transaction_date)}</ViewRow>
              <ViewRow label="Card">
                {[payment.card_type, payment.card_issuer_country].filter(Boolean).join(" · ") || <Empty />}
              </ViewRow>
            </dl>
          </Card>

          <Card title="Student">
            {payment.user ? (
              <dl className="divide-y divide-border">
                <ViewRow label="Name">
                  <Link href={`/users/${payment.user}`} className="text-primary hover:underline">
                    {payment.user_name || payment.user_mobile}
                  </Link>
                </ViewRow>
                <ViewRow label="Mobile">{payment.user_mobile ?? <Empty />}</ViewRow>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">The account that paid has since been deleted.</p>
            )}
          </Card>

          <Card title="Subscription granted">
            {payment.subscription ? (
              <dl className="divide-y divide-border">
                <ViewRow label="From">{date(payment.subscription.starts_at)}</ViewRow>
                <ViewRow label="Until">{date(payment.subscription.expires_at)}</ViewRow>
                <ViewRow label="Status">{payment.subscription.is_active ? "Active" : "Ended"}</ViewRow>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                {payment.status === "VALID"
                  ? "Paid, but no subscription was granted. Check the gateway response."
                  : "None: only a completed payment grants VIP."}
              </p>
            )}
          </Card>
        </div>

        <RawRecord title="SSLCommerz response" record={payment.gateway_response} />
      </div>
    </div>
  );
}
