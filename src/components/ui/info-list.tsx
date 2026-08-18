import type { ComponentProps, CSSProperties, Key, ReactNode } from "react";

import { cn } from "@/lib/utils";

type InfoListColumn<Item> = {
  cellClassName?: string;
  id: string;
  label: ReactNode;
  render: (item: Item) => ReactNode;
};

type InfoListProps<Item> = ComponentProps<"div"> & {
  columns: ReadonlyArray<InfoListColumn<Item>>;
  getKey: (item: Item) => Key;
  gridTemplateColumns: CSSProperties["gridTemplateColumns"];
  items: ReadonlyArray<Item>;
  minWidth?: CSSProperties["minWidth"];
  showHeader?: boolean;
  variant?: "contained" | "plain";
};

function InfoList<Item>({
  className,
  columns,
  getKey,
  gridTemplateColumns,
  items,
  minWidth,
  showHeader = true,
  variant = "plain",
  ...props
}: InfoListProps<Item>) {
  const gridStyle = { gridTemplateColumns };

  return (
    <div
      className={cn(
        "overflow-hidden",
        variant === "contained" && "rounded-[var(--radius-small)] bg-surface",
        className,
      )}
      {...props}
    >
      <div className="overflow-x-auto">
        <div style={{ minWidth }}>
          {showHeader ? (
            <div className="grid gap-4 border-b border-line px-4 py-3 md:px-5" style={gridStyle}>
              {columns.map((column) => (
                <strong className="text-ui-control text-ink-400" key={column.id}>{column.label}</strong>
              ))}
            </div>
          ) : null}
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li className="grid items-center gap-4 px-4 py-5 md:px-5" key={getKey(item)} style={gridStyle}>
                {columns.map((column) => (
                  <div className={column.cellClassName} key={column.id}>
                    <span className="sr-only">{column.label}: </span>
                    {column.render(item)}
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export { InfoList };
export type { InfoListColumn, InfoListProps };
