import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ChoiceGroupProps<Value extends string> = {
  appearance?: "segmented" | "outlined";
  className?: string;
  columns?: 2 | 3;
  icons?: Partial<Record<Value, ReactNode>>;
  label: ReactNode;
  onChange: (value: Value) => void;
  options: readonly Value[];
  scroll?: boolean;
  value: Value;
};

function ChoiceGroup<Value extends string>({
  appearance = "segmented",
  className,
  columns = 3,
  icons,
  label,
  onChange,
  options,
  scroll = false,
  value,
}: ChoiceGroupProps<Value>) {
  const singleRow = options.length <= columns;
  const outlined = appearance === "outlined";

  return (
    <fieldset className={className}>
      <legend className="text-ui-component">{label}</legend>
      <RadioGroup
        className={cn(
          "mt-2",
          outlined
            ? scroll
              ? "no-scrollbar -mx-5 flex w-[calc(100%+2.5rem)] snap-x snap-mandatory gap-2 overflow-x-auto px-5 scroll-px-5 pb-1"
              : "grid gap-2"
            : "grid gap-0 overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-muted p-px",
          !outlined && (singleRow ? "h-[var(--control-touch)]" : "auto-rows-[var(--control-touch)]"),
          !scroll && (columns === 2 ? "grid-cols-2" : "grid-cols-3"),
        )}
        onValueChange={(next) => onChange(next as Value)}
        value={value}
      >
        {options.map((option) => {
          return (
            <Radio.Root
              className={cn(
                "flex cursor-pointer items-center justify-center px-[var(--filter-padding-x)] text-center ui-button-text text-ink-600 outline-none focus-visible:ring-2 focus-visible:ring-primary-300 data-checked:text-primary-700",
                outlined
                  ? "h-[var(--control-touch)] rounded-[var(--radius-control)] border border-line bg-surface data-checked:border-primary-400 data-checked:bg-primary-50"
                  : "rounded-[calc(var(--radius-control)-2px)] border border-transparent data-checked:border-primary-400 data-checked:bg-surface",
                outlined && scroll ? "min-w-[calc(var(--control-touch)*1.9)] shrink-0 snap-start" : icons ? "h-auto min-h-[calc(var(--control-touch)*1.75)] flex-col gap-2 py-3" : singleRow ? "h-full" : "h-[var(--control-touch)]",
              )}
              key={option}
              value={option}
            >
              {icons?.[option] ? <span aria-hidden="true">{icons[option]}</span> : null}
              <span>{option}</span>
            </Radio.Root>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}

export { ChoiceGroup };
export type { ChoiceGroupProps };
