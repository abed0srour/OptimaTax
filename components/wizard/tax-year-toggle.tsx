"use client";

import { useRef, type KeyboardEvent } from "react";
import { TAX_YEARS } from "@/lib/taxData";
import type { TaxYear } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEP_KEYS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/**
 * Segmented switch between tax years, sized for the header. A real radio
 * group: one tab stop, and the arrow keys move the selection, so it costs a
 * keyboard user a single stop on the way to the form.
 */
export function TaxYearToggle({
  value,
  onChange,
}: {
  value: TaxYear;
  onChange: (year: TaxYear) => void;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = TAX_YEARS.length - 1;
    const current = TAX_YEARS.indexOf(value);

    let next: number;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else if (event.key in STEP_KEYS) {
      next = (current + STEP_KEYS[event.key] + TAX_YEARS.length) % TAX_YEARS.length;
    } else return;

    event.preventDefault();
    onChange(TAX_YEARS[next]);
    buttons.current[next]?.focus();
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <span aria-hidden className="hidden text-xs font-medium text-muted-foreground sm:inline">
        Tax year
      </span>
      <div
        role="radiogroup"
        aria-label="Tax year"
        onKeyDown={onKeyDown}
        className="flex gap-0.5 rounded-full border border-border bg-card p-0.5"
      >
        {TAX_YEARS.map((year, index) => {
          const selected = year === value;

          return (
            <button
              key={year}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(year)}
              className={cn(
                "tnum relative h-8 rounded-full px-3 text-[0.8rem] font-medium transition-colors outline-none",
                // Stretches the hit area to 44px tall without growing the pill.
                "before:absolute before:inset-x-0 before:-inset-y-1.5",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
                selected
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {year}
            </button>
          );
        })}
      </div>
    </div>
  );
}
