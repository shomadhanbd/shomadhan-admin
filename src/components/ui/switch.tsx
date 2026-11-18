"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

/** Binary on/off control. */
function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5",
        "transition-colors duration-(--duration-short) ease-(--ease-standard)",
        "bg-input data-checked:bg-primary",
        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "block h-4 w-4 rounded-full bg-white shadow-sm ring-1 ring-black/5",
          "transition-transform duration-(--duration-short) ease-(--ease-standard)",
          "data-checked:translate-x-4",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
