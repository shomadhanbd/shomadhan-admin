"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, MessageSquareText, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { dateTime, money } from "@/lib/format";
import { dashboardApi, dashboardKeys } from "@/features/dashboard/api";
import { otpApi, otpKeys } from "@/features/otp-log/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const TONE = {
  ok: "bg-card ring-foreground/[0.07]",
  low: "bg-warning/10 ring-warning/40",
  empty: "bg-destructive/10 ring-destructive/40",
};

/** The OTP gateway's credit, loud when low: at ৳0 nobody can sign up or reset a password. */
export function SmsCreditCard() {
  const queryClient = useQueryClient();
  const balance = useQuery({
    queryKey: dashboardKeys.smsBalance,
    queryFn: () => dashboardApi.smsBalance(),
    refetchInterval: 5 * 60_000,
  });
  const otp = useQuery({ queryKey: otpKeys.summary, queryFn: otpApi.summary, refetchInterval: 60_000 });
  const recheck = useMutation({
    mutationFn: () => dashboardApi.smsBalance(true),
    onSuccess: (data) => {
      queryClient.setQueryData(dashboardKeys.smsBalance, data);
      queryClient.invalidateQueries({ queryKey: otpKeys.summary });
    },
  });

  if (balance.isLoading) return <Skeleton className="h-36 rounded-(--shape-md)" />;

  const b = balance.data;
  const notSent = otp.data?.not_sent ?? 0;
  const level = b?.level ?? "unknown";
  const alarming = level === "low" || level === "empty" || notSent > 0;

  const headline = !b
    ? "The SMS credit could not be read"
    : level === "empty"
      ? "SMS credit is used up. Students cannot get OTPs"
      : level === "low"
        ? "SMS credit is low. Top up BulkSMSBD before students stop getting codes"
        : !b.available
          ? b.error.replace(/\.$/, "") || "SMS sending is off on this server"
          : b.error
            ? "The SMS credit could not be read"
            : "SMS credit";

  return (
    <section
      aria-live="polite"
      className={cn(
        "rounded-(--shape-md) p-5 shadow-sm ring-1",
        TONE[level === "empty" ? "empty" : alarming ? "low" : "ok"],
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              alarming ? "bg-destructive text-white" : "bg-primary/10 text-primary",
            )}
          >
            {alarming ? <AlertTriangle className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{headline}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              BulkSMSBD sends every OTP. {b?.available && `Warns below ${money(b.warning_below)}.`}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => recheck.mutate()} disabled={recheck.isPending}>
          <RefreshCw className={cn("h-3.5 w-3.5", recheck.isPending && "animate-spin")} />
          Check now
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-10 gap-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Balance</p>
          <p
            className={cn(
              "text-3xl leading-tight font-semibold tracking-tight",
              level === "empty" ? "text-destructive" : "text-foreground",
            )}
          >
            {b?.balance != null ? money(b.balance) : "—"}
          </p>
          {b?.available && b.error && <p className="text-xs text-destructive">{b.error}</p>}
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Codes not sent, last 24 hours</p>
          <Link
            href="/otp-log?status=not_sent"
            className={cn(
              "text-3xl leading-tight font-semibold tracking-tight hover:underline",
              notSent ? "text-destructive" : "text-foreground",
            )}
          >
            {notSent}
          </Link>
          {otp.data?.last_failure && (
            <p className="text-xs text-muted-foreground">
              Last: {otp.data.last_failure.reason}, {dateTime(otp.data.last_failure.at)}
            </p>
          )}
        </div>

        {b?.checked_at && <p className="ml-auto text-xs text-muted-foreground">Checked {dateTime(b.checked_at)}</p>}
      </div>
    </section>
  );
}
