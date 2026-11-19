"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  hasUnsavedChanges,
  interceptBack,
  settlePendingLeave,
  usePendingLeave,
  whenSafeToLeave,
} from "@/hooks/use-leave-warning";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

/** A plain left click on a link to another page of this app, which the router would follow. */
function inAppHref(e: MouseEvent): string | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const link = (e.target as Element | null)?.closest?.("a[href]");
  if (!(link instanceof HTMLAnchorElement)) return null;
  if (link.target && link.target !== "_self") return null;
  if (link.hasAttribute("download")) return null;
  const url = new URL(link.href);
  if (url.origin !== location.origin) return null;
  // A jump within the same page (e.g. the skip link) leaves nothing behind.
  if (url.pathname === location.pathname && url.search === location.search) return null;
  return url.pathname + url.search + url.hash;
}

/**
 * Asks before leaving a page with unsaved changes. Links and the browser's Back are caught in the
 * capture phase, before the router's own handlers; other ways out call `whenSafeToLeave` themselves.
 */
export function LeaveGuard() {
  const router = useRouter();
  const pending = usePendingLeave();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!hasUnsavedChanges()) return;
      const href = inAppHref(e);
      if (!href) return;
      e.preventDefault();
      e.stopPropagation();
      whenSafeToLeave(() => router.push(href));
    }
    document.addEventListener("click", onClick, true);
    // Capture runs before the router's own popstate listener, so Back can be held for the question.
    window.addEventListener("popstate", interceptBack, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", interceptBack, true);
    };
  }, [router]);

  return (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(open) => !open && settlePendingLeave(false)}
      title="Leave without saving?"
      description="Your changes on this page have not been saved. Leaving now discards them."
      confirmLabel="Discard and leave"
      cancelLabel="Keep editing"
      onConfirm={() => settlePendingLeave(true)}
    />
  );
}
