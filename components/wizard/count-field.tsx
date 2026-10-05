"use client";

import { useId } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A small stepper for counts that are almost always 0–4. Buttons rather than a
 * text field: the value is never long enough to be worth typing, and steppers
 * are far kinder on a phone.
 */
export function CountField({
  label,
  hint,
  value,
  onChange,
  max = 20,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  const id = useId();
  const set = (next: number) => onChange(Math.min(Math.max(next, 0), max));

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p id={id} className="text-[0.95rem] font-medium">
          {label}
        </p>
        {hint ? (
          <p className="mt-0.5 text-[0.8rem] leading-snug text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>

      <div
        role="group"
        aria-labelledby={id}
        className="flex shrink-0 items-center gap-1 rounded-full border border-border p-1"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => set(value - 1)}
          disabled={value <= 0}
          aria-label={`Decrease ${label}`}
          className="size-9 rounded-full"
        >
          <Minus />
        </Button>
        <output
          aria-live="polite"
          className="tnum w-6 text-center text-base font-semibold"
        >
          {value}
        </output>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => set(value + 1)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="size-9 rounded-full"
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
