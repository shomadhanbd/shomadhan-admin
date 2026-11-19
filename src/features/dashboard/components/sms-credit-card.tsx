"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, MessageSquareText, RefreshCw, Siren } from "lucide-react";
import { cn } from "@/lib/utils";
import { dateTime, money } from "@/lib/format";
import { dashboardApi, dashboardKeys } from "@/features/dashboard/api";
import { otpApi, otpKeys } from "@/features/otp-log/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const TONE = {
  ok: "",
  low: "border-warning/40 bg-warning-surface",
  empty: "border-destructive/40 bg-destructive-surface",
};

/** The OTP gateway's credit as a dashboard card, loud when low: at ৳0 nobody can sign up or reset a password. */
export function SmsCreditCard() {
  const queryClient = useQueryClient();
  const balance = useQuery({
    queryKey: dashboardKeys.smsBalance,
    queryFn: () => dashboardApi.smsBalance(),
    refetchInterval: 5 * 60_000,
  });
  const otp = useQuery({ queryKey: otpKeys.summary, queryFn: otpApi.summary, refetchInterval: 60_000 });
  const recheck = useMutation({
    mutationFn: () => dashboardApi.smsBalance(),
    onSuccess: (data) => {
      queryClient.setQueryData(dashboardKeys.smsBalance, data);
      queryClient.invalidateQueries({ queryKey: otpKeys.summary });
    },
  });

  if (balance.isLoading) return <Skeleton className="col-span-2 h-[104px] rounded-(--shape-md) lg:col-span-1" />;

  const b = balance.data;
  const notSent = otp.data?.not_sent ?? 0;
  const level = b?.level;
  const alarming = level === "low" || level === "empty" || notSent > 0;

  // What the number means: the state when it needs action, otherwise why it is missing.
  const status = !b
    ? "Could not be read"
    : level === "empty"
      ? "Used up: students get no OTPs"
      : level === "low"
        ? "Low: top up BulkSMSBD"
        : b.error
          ? b.error.replace(/\.$/, "")
          : `Warns below ${money(b.warning_below)}`;

  return (
    <div
      aria-live="polite"
      title={b?.checked_at && `Checked ${dateTime(b.checked_at)}`}
      className={cn(
        // Full width on a phone, where the other tiles pair up two across.
        "relative col-span-2 h-full overflow-hidden rounded-(--shape-md) surface p-4 lg:col-span-1",
        TONE[level === "empty" ? "empty" : alarming ? "low" : "ok"],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-sm font-medium text-muted-foreground">SMS balance</span>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Check the SMS balance now"
            title="Check now"
            onClick={() => recheck.mutate()}
            disabled={recheck.isPending}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", recheck.isPending && "animate-spin")} />
          </Button>
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-(--shape-sm)",
              alarming ? "bg-destructive text-white" : "bg-primary-surface text-primary",
            )}
          >
            {level === "empty" ? (
              <Siren className="h-4 w-4" />
            ) : alarming ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <MessageSquareText className="h-4 w-4" />
            )}
          </span>
        </div>
      </div>

      <p
        className={cn(
          "mt-2 text-2xl leading-none font-semibold tracking-tight",
          alarming && b?.balance != null ? "text-destructive" : "text-foreground",
        )}
      >
        {b?.balance != null ? money(b.balance) : "—"}
      </p>
      <p
        className={cn("mt-2 truncate text-xs", alarming ? "text-destructive" : "text-muted-foreground")}
        title={status}
      >
        {status}
      </p>
      {notSent > 0 && (
        <Link
          href="/otp-log?status=not_sent"
          className="mt-1 block truncate text-xs font-medium text-destructive hover:underline"
          title={otp.data?.last_failure?.reason}
        >
          {notSent} {notSent === 1 ? "code" : "codes"} not sent in 24 hours
        </Link>
      )}
    </div>
  );
}
