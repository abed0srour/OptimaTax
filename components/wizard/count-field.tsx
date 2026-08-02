"use client";

import { useId, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * A small stepper for counts that are almost always 0–4. Buttons rather than a
 * text field: the value is never long enough to be worth typing, and steppers
 * are far kinder on a phone.
 */
export function CountField({
  label,
  hint,
  icon,
  value,
  onChange,
  max = 20,
}: {
  label: string;
  hint?: string;
  icon?: ReactNode;
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  const id = useId();
  const set = (next: number) => onChange(Math.min(Math.max(next, 0), max));

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-3.5 py-2.5">
      <div className="min-w-0">
        <Label
          htmlFor={id}
          className="flex items-center gap-2 text-[0.9rem] font-medium"
        >
          {icon ? (
            <span className="shrink-0 text-muted-foreground [&_svg]:size-4">
              {icon}
            </span>
          ) : null}
          {label}
        </Label>
        {hint ? (
          <p className="mt-0.5 text-[0.78rem] leading-snug text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => set(value - 1)}
          disabled={value <= 0}
          aria-label={`Decrease ${label}`}
        >
          <Minus />
        </Button>
        <output
          id={id}
          aria-live="polite"
          className="tnum w-7 text-center text-[0.95rem] font-semibold"
        >
          {value}
        </output>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => set(value + 1)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
