"use client";

import { useId, type ReactNode } from "react";
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
  icon,
  value,
  onChange,
  placeholder = "0",
  action,
  tone = "default",
  disabled = false,
}: {
  label: string;
  icon?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  action?: { label: string; onClick: () => void; title?: string };
  tone?: "default" | "give";
  disabled?: boolean;
}) {
  const id = useId();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Label
          htmlFor={id}
          className="flex items-center gap-2 text-[0.9rem] font-medium"
        >
          {icon ? (
            <span
              className={cn(
                "shrink-0 [&_svg]:size-4",
                tone === "give" ? "text-give" : "text-muted-foreground",
              )}
            >
              {icon}
            </span>
          ) : null}
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
          disabled={disabled}
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
