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

/** The action cluster at the end of a table row, as one segmented control. */
export function RowActions({ primary, actions }: { primary?: { label: string; href: string }; actions: RowAction[] }) {
  return (
    <TooltipProvider delay={300}>
      <div className="inline-flex items-center overflow-hidden rounded-(--shape-sm) border border-border bg-card shadow-xs">
        {primary && (
          <Link
            href={primary.href}
            // `whitespace-nowrap` matters: a two-word label wrapped inside the
            // segment and pushed the group taller than its icon buttons.
            className="flex h-8 items-center gap-1 pr-2 pl-3 text-xs font-medium whitespace-nowrap text-foreground transition-colors duration-(--duration-short) hover:bg-primary/(--state-hover) hover:text-primary"
          >
            {primary.label}
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        )}

        {actions.map((a, i) => (
          <Tooltip key={a.label}>
            <TooltipTrigger
              onClick={a.onClick}
              aria-label={a.label}
              // Dividers come from a left border on each segment after the
              // first, so the group keeps one continuous outer edge.
              className={`flex h-8 w-9 items-center justify-center transition-colors duration-(--duration-short) ${
                primary || i > 0 ? "border-l border-border" : ""
              } ${
                a.destructive
                  ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  : "text-muted-foreground hover:bg-primary/(--state-hover) hover:text-primary"
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
