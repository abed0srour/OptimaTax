"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const valueClass = {
  default: "text-foreground",
  keep: "text-keep-ink",
  give: "text-give-ink",
  tax: "text-tax-ink",
} as const;

const surfaceClass = {
  default: "bg-muted",
  keep: "bg-keep-soft",
  give: "bg-give-soft",
  tax: "bg-tax-soft",
} as const;

/**
 * The figure a step is building toward, set large in the display face —
 * on these screens it is the answer rather than a footnote.
 */
export function Readout({
  label,
  value,
  tone = "default",
  action,
}: {
  label: string;
  value: string;
  tone?: keyof typeof valueClass;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl px-5 py-6 text-center",
        surfaceClass[tone],
      )}
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {/* Steps down on narrow screens so seven-figure amounts still fit. */}
      <p
        className={cn(
          "tnum font-display max-w-full text-[2.75rem] leading-none tracking-tight wrap-break-word sm:text-6xl",
          valueClass[tone],
        )}
      >
        {value}
      </p>
      {action}
    </div>
  );
}
