import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A plain `<details>` dressed to match the cards. Detail that most people never
 * need — bracket walkthroughs, caveats — lives in one of these so the default
 * view stays short.
 */
export function Disclosure({
  title,
  icon,
  aside,
  children,
  className,
  defaultOpen = false,
}: {
  title: string;
  icon?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "group rounded-xl border border-border bg-card open:bg-muted/30",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
        <span className="flex min-w-0 items-center gap-2.5">
          {icon ? (
            <span className="shrink-0 text-muted-foreground [&_svg]:size-4">
              {icon}
            </span>
          ) : null}
          {title}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs whitespace-nowrap text-muted-foreground">
          {aside}
          <ChevronDown
            aria-hidden
            className="size-4 transition-transform group-open:rotate-180"
          />
        </span>
      </summary>
      <div className="border-t border-border px-4 py-3.5">{children}</div>
    </details>
  );
}
