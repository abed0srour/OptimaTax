import { Check, Moon, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card
      className={cn(
        "rounded-2xl shadow-sm [--card-spacing:--spacing(5)]",
        covered ? "bg-keep-soft ring-keep/25" : "ring-foreground/8",
      )}
    >
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Moon className="size-4 shrink-0 text-give" />
            Khums this year
          </span>
          <span className="tnum text-sm font-semibold">
            {formatCurrency(khums.obligation)}
          </span>
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

        <div className="flex items-start gap-2.5">
          <span
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white",
              covered ? "bg-keep" : "bg-note",
            )}
          >
            {covered ? (
              <Check className="size-3" strokeWidth={3.5} />
            ) : (
              <TriangleAlert className="size-3" strokeWidth={2.5} />
            )}
          </span>
          <p
            className={cn(
              "text-[0.85rem] leading-relaxed",
              covered ? "text-keep-ink" : "text-note-ink",
            )}
          >
            {verdict(khums, donation, percent)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function verdict(khums: KhumsBreakdown, donation: number, percent: number): string {
  if (donation <= 0) {
    return `You gave nothing this year, so none of your ${formatCurrency(
      khums.obligation,
    )} khums is covered.`;
  }
  if (khums.remaining > 0) {
    return `Your ${formatCurrency(donation)} donation covers ${formatCurrency(
      khums.fulfilled,
    )} of your khums — ${percent}% of it. ${formatCurrency(
      khums.remaining,
    )} is still outstanding.`;
  }
  if (khums.surplus > 0) {
    return `Your ${formatCurrency(
      donation,
    )} donation covers your khums in full, with ${formatCurrency(
      khums.surplus,
    )} given beyond it as sadaqah.`;
  }
  return `Your ${formatCurrency(donation)} donation covers your khums exactly.`;
}
