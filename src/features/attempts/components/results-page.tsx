"use client";

import { PageHeader } from "@/components/shared/page-shell";
import { AttemptsTable } from "./attempts-table";

/** `/results`: every student's attempt at every mock test, newest first. */
export function ResultsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Results"
        description="Every attempt at every mock test; filter to Needs marking to find papers waiting for marks"
      />
      <AttemptsTable />
    </div>
  );
}
