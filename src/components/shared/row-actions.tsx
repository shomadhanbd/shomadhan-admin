"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RowAction {
  icon: React.ReactNode;
  /** Also the tooltip text, so it must name the record: "Delete HSC ICT". */
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

/** The actions at the end of a table row: an "Open" chip, then quiet icon buttons. */
export function RowActions({ primary, actions }: { primary?: { label: string; href: string }; actions: RowAction[] }) {
  return (
    <TooltipProvider delay={300}>
      <div className="inline-flex items-center gap-1">
        {primary && (
          <Link
            href={primary.href}
            // `whitespace-nowrap` keeps a two-word label on one line, level with the icon buttons.
            className="mr-1 flex h-8 items-center gap-0.5 rounded-(--shape-xs) bg-primary-surface pr-2 pl-3 text-xs font-semibold whitespace-nowrap text-primary transition-colors duration-(--duration-short) hover:bg-primary hover:text-primary-foreground dark:text-accent-foreground"
          >
            {primary.label}
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        )}

        {actions.map((a) => (
          <Tooltip key={a.label}>
            <TooltipTrigger
              onClick={a.onClick}
              aria-label={a.label}
              className={`flex h-8 w-8 items-center justify-center rounded-(--shape-xs) transition-colors duration-(--duration-short) ${
                a.destructive
                  ? "text-muted-foreground hover:bg-destructive-surface hover:text-destructive"
                  : "text-muted-foreground hover:bg-accent hover:text-primary"
              }`}
            >
              {a.icon}
            </TooltipTrigger>
            <TooltipContent>{a.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
