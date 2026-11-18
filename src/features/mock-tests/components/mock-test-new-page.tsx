"use client";

import { PageHeader } from "@/components/shared/page-shell";
import { MockTestForm } from "./mock-test-form";

/** `/mock-tests/new`: a mock test built from scratch. */
export function MockTestNewPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New mock test" description="A timed test for a chosen audience" backHref="/mock-tests" />
      <MockTestForm test={null} cancelHref="/mock-tests" />
    </div>
  );
}
