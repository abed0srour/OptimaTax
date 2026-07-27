"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const toneClass = {
  default: "border-border bg-muted/50",
  keep: "border-keep/30 bg-keep-soft",
  give: "border-give/30 bg-give-soft",
  tax: "border-tax/30 bg-tax-soft",
} as const;

const valueClass = {
  default: "text-foreground",
  keep: "text-keep-ink",
  give: "text-give-ink",
  tax: "text-tax-ink",
} as const;

const labelClass = {
  default: "text-muted-foreground",
  keep: "text-keep-ink/70",
  give: "text-give-ink/70",
  tax: "text-tax-ink/70",
} as const;

/**
 * The figure a step is building toward. Centred and oversized, because on these
 * screens it is the answer rather than a footnote.
 */
export function Readout({
  label,
  value,
  tone = "default",
  action,
}: {
  label: string;
  value: string;
  tone?: keyof typeof toneClass;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border px-5 py-6 text-center",
        toneClass[tone],
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold tracking-wider uppercase",
          labelClass[tone],
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "text-4xl leading-none font-semibold tracking-tight sm:text-5xl",
          valueClass[tone],
        )}
      >
        {value}
      </p>
      {action}
    </div>
  );
}
