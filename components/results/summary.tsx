import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { TaxComparison } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The one number the whole wizard exists to produce, plus the sentence for it. */
export function Headline({ comparison }: { comparison: TaxComparison }) {
  const { taxSavings, donationEntered, netCostOfGiving, givingDiscount } = comparison;
  const saving = donationEntered > 0 && taxSavings > 0;

  return (
    <Card
      className={cn(
        "rounded-2xl shadow-sm [--card-spacing:--spacing(6)]",
        saving ? "bg-keep-soft ring-keep/25" : "ring-foreground/8",
      )}
    >
      <CardContent className="space-y-2">
        <p className="text-[0.8rem] font-semibold tracking-wider text-muted-foreground uppercase">
          {saving ? "Tax you legally avoid" : "Tax saved by giving"}
        </p>
        <p
          className={cn(
            "tnum text-5xl leading-none font-semibold tracking-tight sm:text-6xl",
            saving ? "text-keep-ink" : "text-foreground",
          )}
        >
          {formatCurrency(taxSavings)}
        </p>
        <p className="max-w-prose text-[0.95rem] leading-relaxed text-foreground/80">
          {describe(donationEntered, taxSavings, netCostOfGiving, givingDiscount)}
        </p>
      </CardContent>
    </Card>
  );
}

function describe(
  donation: number,
  savings: number,
  netCost: number,
  discount: number,
): string {
  if (donation <= 0) {
    return "You haven't entered a donation, so this is the untouched tax bill. Go back a step and add a gift to see what changes.";
  }
  if (savings <= 0) {
    return "At this income and deduction level the gift doesn't reduce the bill further — taxable income is already at or below zero, or your state grants no charitable deduction.";
  }
  return `Giving ${formatCurrency(donation)} to a 501(c)(3) costs you ${formatCurrency(
    Math.max(0, netCost),
  )} out of pocket, because ${formatCurrency(
    savings,
  )} of it would have gone to the government anyway — a ${formatPercent(
    discount,
    1,
  )} discount on every dollar you give.`;
}

const statTone = {
  default: "ring-foreground/8",
  keep: "bg-keep-soft ring-keep/20",
  tax: "bg-tax-soft ring-tax/20",
  give: "bg-give-soft ring-give/20",
} as const;

const statInk = {
  default: "text-foreground",
  keep: "text-keep-ink",
  tax: "text-tax-ink",
  give: "text-give-ink",
} as const;

export function Stat({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: keyof typeof statTone;
}) {
  return (
    <Card size="sm" className={cn("gap-1 rounded-xl shadow-none", statTone[tone])}>
      <CardContent className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "tnum text-2xl leading-none font-semibold tracking-tight",
            statInk[tone],
          )}
        >
          {value}
        </p>
        <p className="text-[0.7rem] leading-snug text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
