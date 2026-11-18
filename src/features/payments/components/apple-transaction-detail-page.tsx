"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { dateTime } from "@/lib/format";
import { paymentKeys, paymentsApi } from "@/features/payments/api";
import { appleStatus } from "@/features/payments/constants";
import { Badge } from "@/components/ui/badge";
import { Empty, ViewRow } from "@/components/shared/edit-card";
import { PageHeader } from "@/components/shared/page-shell";
import { Card, Loading, NotFound, RawRecord } from "./payment-detail-page";

/** `/billing/payments/apple/{id}`: one App Store purchase and the decoded transaction Apple signed. */
export function AppleTransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: purchase, isLoading } = useQuery({
    queryKey: [...paymentKeys.apple, "detail", Number(id)],
    queryFn: () => paymentsApi.getApple(Number(id)),
  });

  if (isLoading) return <Loading />;
  if (!purchase) return <NotFound title="App Store purchase" />;

  const status = appleStatus(purchase.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title={purchase.product_title ?? purchase.apple_product_id}
        description={purchase.original_transaction_id}
        backHref="/billing/payments"
      >
        <Badge variant={status.variant}>{status.name}</Badge>
        {purchase.environment === "Sandbox" && <Badge variant="outline">Sandbox</Badge>}
      </PageHeader>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <Card title="Purchase">
            <dl className="divide-y divide-border">
              <ViewRow label="App Store product">
                <span className="font-mono text-xs">{purchase.apple_product_id}</span>
              </ViewRow>
              <ViewRow label="Plan">{purchase.product_title ?? "Not mapped to a plan"}</ViewRow>
              <ViewRow label="Bought">{dateTime(purchase.purchase_date)}</ViewRow>
              <ViewRow label="Refunded or revoked">{dateTime(purchase.revocation_date)}</ViewRow>
              <ViewRow label="Original transaction">
                <span className="font-mono text-xs">{purchase.original_transaction_id}</span>
              </ViewRow>
              <ViewRow label="Latest transaction">
                <span className="font-mono text-xs">{purchase.transaction_id}</span>
              </ViewRow>
            </dl>
          </Card>

          <Card title="Student">
            <dl className="divide-y divide-border">
              <ViewRow label="Name">
                <Link href={`/users/${purchase.user}`} className="text-primary hover:underline">
                  {purchase.user_name || purchase.user_mobile}
                </Link>
              </ViewRow>
              <ViewRow label="Mobile">{purchase.user_mobile ?? <Empty />}</ViewRow>
            </dl>
          </Card>
        </div>

        <RawRecord title="Apple transaction" record={purchase.raw_payload} />
      </div>
    </div>
  );
}
