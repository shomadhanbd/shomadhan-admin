import { redirect } from "next/navigation";

/** The attempts live on the test's own page now, as its Attempts tab. */
export default async function MockTestAttemptsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/mock-tests/${id}?tab=attempts`);
}
