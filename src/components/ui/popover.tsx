import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

function PopoverContent({ className, ...props }: PopoverPrimitive.Popup.Props) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner align="end" sideOffset={8}>
        <PopoverPrimitive.Popup
          className={cn(
            "relative z-[var(--z-tooltip)] max-h-[calc(100dvh-7rem)] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-[var(--radius-card)] border border-line bg-surface text-ink-900 shadow-[var(--shadow-raised)] outline-none",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
