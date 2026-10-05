import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import type { KhumsBreakdown } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Khums appears only here, on the results screen: whether the donation covered
 * the year's obligation, and if not, how much of it it did.
 */
export function KhumsCoverage({
  khums,
  donation,
}: {
  khums: KhumsBreakdown;
  donation: number;
}) {
  const covered = khums.remaining <= 0;
  const percent = Math.round(khums.coverage * 100);

  return (
    <section className="space-y-3 rounded-[1.75rem] border border-border bg-card px-5 py-5 sm:px-8 sm:py-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[0.95rem] font-medium">Khums</h2>
        <p className="tnum text-sm whitespace-nowrap text-muted-foreground">
          <span className={cn("font-semibold", covered ? "text-keep-ink" : "text-foreground")}>
            {percent}%
          </span>{" "}
          of {formatCurrency(khums.obligation)}
        </p>
      </div>

      <Progress
        value={percent}
        aria-label="Share of the khums obligation covered by the donation"
        className={cn(
          "h-2",
          covered
            ? "**:data-[slot=progress-indicator]:bg-keep"
            : "**:data-[slot=progress-indicator]:bg-give",
        )}
      />

      <p className="text-sm leading-relaxed text-muted-foreground">
        {verdict(khums, donation)}
      </p>
    </section>
  );
}

function verdict(khums: KhumsBreakdown, donation: number): string {
  if (donation <= 0) {
    return "Nothing given yet, so none of it is covered.";
  }
  if (khums.remaining > 0) {
    return `${formatCurrency(khums.remaining)} still to give.`;
  }
  if (khums.surplus > 0) {
    return `Covered in full, with ${formatCurrency(khums.surplus)} more given as sadaqah.`;
  }
  return "Covered exactly.";
}
