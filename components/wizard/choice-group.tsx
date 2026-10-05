"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface Choice<T extends string> {
  value: T;
  label: string;
  detail?: string;
}

/**
 * A radio group drawn as tappable rows. Bigger targets than a select, and the
 * optional detail line stays visible instead of hiding inside a dropdown.
 */
export function ChoiceGroup<T extends string>({
  label,
  value,
  choices,
  onChange,
  columns = 2,
}: {
  label: string;
  value: T;
  choices: Choice<T>[];
  onChange: (value: T) => void;
  columns?: 1 | 2;
}) {
  const legendId = useId();

  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium" id={legendId}>
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={legendId}
        className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2")}
      >
        {choices.map((choice) => {
          const selected = choice.value === value;

          return (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(choice.value)}
              className={cn(
                "flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
                selected
                  ? "border-foreground bg-foreground/3"
                  : "border-border hover:border-foreground/30",
              )}
            >
              <span className="grid min-w-0 gap-0.5">
                <span className="text-[0.95rem] leading-snug font-medium">
                  {choice.label}
                </span>
                {choice.detail ? (
                  <span className="text-[0.8rem] leading-snug text-muted-foreground">
                    {choice.detail}
                  </span>
                ) : null}
              </span>

              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selected ? "border-foreground" : "border-input",
                )}
              >
                {selected ? (
                  <span className="size-2.5 rounded-full bg-foreground" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
