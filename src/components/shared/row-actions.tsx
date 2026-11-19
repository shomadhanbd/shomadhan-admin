"use client";

import { Menu } from "@base-ui/react/menu";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RowAction {
  icon: React.ReactNode;
  /** The menu item's text, short: "Edit", "Delete"; the button already names the record. */
  label: string;
  onClick: () => void;
  destructive?: boolean;
  /** Why the action can't be taken right now; the item is disabled and says so. */
  blockedBy?: string | null;
}

/**
 * A row's actions behind one "⋯" button, so a table shows a single quiet control per row
 * instead of a line of icons. Destructive actions sit last, after a divider.
 */
export function RowActions({ name, actions }: { name: string; actions: RowAction[] }) {
  const safe = actions.filter((a) => !a.destructive);
  const destructive = actions.filter((a) => a.destructive);

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Actions for ${name}`}
        className="flex h-8 w-8 items-center justify-center rounded-(--shape-xs) text-muted-foreground transition-colors duration-(--duration-short) outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 data-popup-open:bg-accent data-popup-open:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={4} className="isolate z-50">
          <Menu.Popup className="min-w-44 origin-(--transform-origin) rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            {safe.map((a) => (
              <ActionItem key={a.label} action={a} />
            ))}
            {safe.length > 0 && destructive.length > 0 && <Menu.Separator className="-mx-1 my-1 h-px bg-border" />}
            {destructive.map((a) => (
              <ActionItem key={a.label} action={a} />
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ActionItem({ action }: { action: RowAction }) {
  const blocked = Boolean(action.blockedBy);
  return (
    <Menu.Item
      disabled={blocked}
      onClick={action.onClick}
      className={cn(
        "flex cursor-default items-start gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-accent data-disabled:cursor-not-allowed [&_svg]:mt-0.5 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
        action.destructive && !blocked
          ? "text-destructive data-highlighted:bg-destructive-surface"
          : "text-foreground [&_svg]:text-muted-foreground",
        blocked && "text-muted-foreground",
      )}
    >
      {action.icon}
      <span className="min-w-0">
        {action.label}
        {blocked && <span className="block text-xs text-muted-foreground">{action.blockedBy}</span>}
      </span>
    </Menu.Item>
  );
}
