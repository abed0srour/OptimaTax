"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoneyInput } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * A large, unhurried currency field. The value is kept as display text and
 * re-grouped on every keystroke, so what you see is always what parses.
 */
export function MoneyField({
  label,
  value,
  onChange,
  placeholder = "0",
  action,
  tone = "default",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  action?: { label: string; onClick: () => void; title?: string };
  tone?: "default" | "give";
}) {
  const id = useId();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <Label htmlFor={id} className="text-[0.9rem] font-medium">
          {label}
        </Label>
        {action ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={action.onClick}
            title={action.title}
            className={cn(
              "-my-0.5 font-semibold",
              tone === "give" ? "text-give-ink hover:bg-give-soft" : "text-primary",
            )}
          >
            {action.label}
          </Button>
        ) : null}
      </div>

      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xl font-medium text-muted-foreground"
        >
          $
        </span>
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(formatMoneyInput(event.target.value))}
          className={cn(
            "tnum h-14 rounded-xl bg-card pl-9 text-xl font-semibold tracking-tight md:text-xl",
            "placeholder:font-normal placeholder:tracking-normal",
            tone === "give" && "focus-visible:border-give focus-visible:ring-give/25",
          )}
        />
      </div>
    </div>
  );
}
