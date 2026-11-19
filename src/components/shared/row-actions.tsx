"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RowAction {
  icon: React.ReactNode;
  /** Also the tooltip text, so it must name the record: "Delete HSC ICT". */
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

/** The quiet icon buttons at the end of a table row; the row itself opens the record. */
export function RowActions({ actions }: { actions: RowAction[] }) {
  return (
    <TooltipProvider delay={300}>
      <div className="inline-flex items-center gap-1">
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
