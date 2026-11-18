import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Mascot } from "@/components/shared/doodles";

/** Any address that matches no page: say so in the admin's own look, with a way back. */
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-4 text-center">
      <Mascot className="mb-6 h-24 w-24 text-primary/40" />
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">This page does not exist</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The address may be mistyped, or the page may have moved. Check it, or start again from the dashboard.
      </p>
      <Link href="/dashboard" className={`${buttonClass({ size: "lg" })} mt-6`}>
        Go to the dashboard
      </Link>
    </main>
  );
}
