"use client";

import { cn } from "@/lib/utils";

export type WizardMode = "quick" | "detailed";

const MODES: { value: WizardMode; label: string; detail: string }[] = [
  { value: "quick", label: "Quick estimate", detail: "4 steps, from AGI" },
  { value: "detailed", label: "Detailed", detail: "5 steps, itemized" },
];

/** Segmented switch between the quick estimate and the full wizard. */
export function ModeToggle({
  value,
  onChange,
}: {
  value: WizardMode;
  onChange: (mode: WizardMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Calculator mode"
      className="grid grid-cols-2 gap-1 rounded-full border border-border bg-card p-1"
    >
      {MODES.map((mode) => {
        const selected = mode.value === value;

        return (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mode.value)}
            className={cn(
              "grid min-h-12 gap-0.5 rounded-full px-3 py-2 text-center transition-colors outline-none",
              "focus-visible:ring-3 focus-visible:ring-ring/50",
              selected
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="text-[0.95rem] leading-none font-medium">
              {mode.label}
            </span>
            <span
              className={cn(
                "text-[0.75rem] leading-none",
                selected ? "text-background/70" : "text-muted-foreground",
              )}
            >
              {mode.detail}
            </span>
          </button>
        );
      })}
    </div>
  );
}
