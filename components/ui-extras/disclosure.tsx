import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A plain `<details>` dressed to match the sheet. Detail that most people
 * never need — extra income types, bracket walkthroughs — lives in one of
 * these so the default view stays short.
 */
export function Disclosure({
  title,
  aside,
  children,
  className,
  defaultOpen = false,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className={cn("group rounded-2xl border border-border bg-card", className)}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[0.95rem] font-medium transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">{title}</span>
        <span className="flex shrink-0 items-center gap-2 text-sm whitespace-nowrap text-muted-foreground">
          {aside}
          <ChevronDown
            aria-hidden
            className="size-4 transition-transform group-open:rotate-180"
          />
        </span>
      </summary>
      <div className="border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}
