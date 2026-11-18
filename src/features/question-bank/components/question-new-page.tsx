"use client";

import { use } from "react";
import { PageHeader } from "@/components/shared/page-shell";
import { QuestionBlockForm } from "./question-block-form";

/** `/question-bank/new`: `?subject=` and `?chapter=` carry over the list's filters, so a new question starts there. */
export function QuestionNewPage({ searchParams }: { searchParams: Promise<{ subject?: string; chapter?: string }> }) {
  const { subject = "", chapter = "" } = use(searchParams);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New question"
        description="Saved to the question bank and shown to students of its subject"
        backHref="/question-bank"
      />
      <QuestionBlockForm block={null} defaults={{ subject, chapter }} cancelHref="/question-bank" />
    </div>
  );
}
