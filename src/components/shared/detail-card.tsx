"use client";

import axios from "axios";
import { RotateCcw } from "lucide-react";
import { apiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/shared/page-shell";

/** The frame of every card on a record's page. */
export const CARD = "rounded-(--shape-md) surface";

/** A titled card on a record's page, with an optional control on the right of its header. */
export function DetailCard({
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

/**
 * A record's page when its record did not load. Only a 404 means it is gone; anything else (the
 * network, a server error) says what happened and offers to try again.
 */
export function RecordUnavailable({
  title,
  backHref,
  icon,
  noun,
  error,
  onRetry,
}: {
  /** The page's heading, e.g. "Question". */
  title: string;
  backHref: string;
  icon: React.ReactNode;
  /** What the record is, for the message: "question", "mock test". */
  noun: string;
  error: unknown;
  onRetry: () => void;
}) {
  const missing = axios.isAxiosError(error) && error.response?.status === 404;
  return (
    <div className="space-y-6">
      <PageHeader title={title} backHref={backHref} />
      <div className={CARD}>
        {missing ? (
          <EmptyState icon={icon} title={`This ${noun} could not be found`} description="It may have been deleted." />
        ) : (
          <EmptyState
            icon={icon}
            title={`This ${noun} could not be loaded`}
            description={apiError(error)}
            action={
              <Button variant="outline" onClick={onRetry}>
                <RotateCcw className="h-4 w-4" />
                Try again
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
