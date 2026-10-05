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
  size = "lg",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  action?: { label: string; onClick: () => void; title?: string };
  tone?: "default" | "give";
  /** `md` for the secondary fields tucked inside a disclosure. */
  size?: "md" | "lg";
  disabled?: boolean;
}) {
  const id = useId();
  const large = size === "lg";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Label htmlFor={id} className="text-sm leading-snug font-medium">
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
              tone === "give" ? "text-give-ink hover:bg-give-soft" : "",
            )}
          >
            {action.label}
          </Button>
        ) : null}
      </div>

      <div className="relative">
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-medium text-muted-foreground",
            large ? "text-xl" : "text-base",
          )}
        >
          $
        </span>
        {/* Never below 16px — anything smaller makes iOS zoom on focus. */}
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(formatMoneyInput(event.target.value))}
          disabled={disabled}
          className={cn(
            "tnum rounded-2xl bg-card font-semibold tracking-tight",
            "placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/60",
            "focus-visible:border-foreground focus-visible:ring-foreground/10",
            large ? "h-14 pl-9 text-xl md:text-xl" : "h-12 pl-8 text-base md:text-base",
            tone === "give" && "focus-visible:border-give focus-visible:ring-give/20",
          )}
        />
      </div>
    </div>
  );
}
