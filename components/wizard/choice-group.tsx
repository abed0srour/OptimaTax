"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Choice<T extends string> {
  value: T;
  label: string;
  detail?: string;
}

/**
 * A radio group drawn as tappable cards. Bigger targets than a select, and the
 * secondary detail line stays visible instead of hiding inside a dropdown.
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
    <div className="space-y-2">
      <p className="text-[0.9rem] font-medium" id={legendId}>
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
                "group flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
                selected
                  ? "border-primary bg-accent/60"
                  : "border-border bg-card hover:border-foreground/20 hover:bg-muted/50",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card",
                )}
              >
                {selected ? <Check className="size-3" strokeWidth={3.5} /> : null}
              </span>

              <span className="grid gap-0.5">
                <span
                  className={cn(
                    "text-sm leading-snug",
                    selected ? "font-semibold" : "font-medium",
                  )}
                >
                  {choice.label}
                </span>
                {choice.detail ? (
                  <span className="tnum text-xs leading-snug text-muted-foreground">
                    {choice.detail}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
