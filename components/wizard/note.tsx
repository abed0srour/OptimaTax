import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const dotClass = {
  note: "bg-note",
  tax: "bg-tax",
  keep: "bg-keep",
} as const;

/** A one-line caveat. A coloured dot and plain text — no boxed alert. */
export function Note({
  tone = "note",
  children,
}: {
  tone?: keyof typeof dotClass;
  children: ReactNode;
}) {
  return (
    <p role="status" className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
      <span
        aria-hidden
        className={cn("mt-[0.45rem] size-1.5 shrink-0 rounded-full", dotClass[tone])}
      />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
