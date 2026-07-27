"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const toneClass = {
  default: "border-border bg-muted/50",
  keep: "border-keep/25 bg-keep-soft",
  give: "border-give/25 bg-give-soft",
  tax: "border-tax/25 bg-tax-soft",
} as const;

const valueClass = {
  default: "text-foreground",
  keep: "text-keep-ink",
  give: "text-give-ink",
  tax: "text-tax-ink",
} as const;

/**
 * The running total a step is building toward, shown under its inputs so the
 * effect of a change is visible without moving on.
 */
export function Readout({
  label,
  value,
  hint,
  tone = "default",
  action,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: keyof typeof toneClass;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border px-4 py-3.5",
        toneClass[tone],
      )}
    >
      <div className="min-w-0">
        <p className="text-[0.8rem] font-medium text-muted-foreground">{label}</p>
        {hint ? (
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground/80">{hint}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <p
          className={cn(
            "tnum text-2xl font-semibold tracking-tight",
            valueClass[tone],
          )}
        >
          {value}
        </p>
        {action}
      </div>
    </div>
  );
}
