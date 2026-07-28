import { ArrowDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { TaxComparison } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Two totals and the gap between them. Deliberately not a chart — two numbers
 * and a delta read faster as figures than as bars, and the bar chart's job
 * (where the money goes) is already done by `MoneyFlow` above.
 */
export function TaxCompare({ comparison }: { comparison: TaxComparison }) {
  const { scenarioA, scenarioB, taxSavings, stateEntry } = comparison;
  const saved = taxSavings > 0;

  return (
    <Card className="rounded-2xl shadow-sm ring-foreground/8 [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>Did donating lower the bill?</CardTitle>
        <CardDescription>
          Federal
          {stateEntry.tax_type !== "none" ? ` and ${stateEntry.name}` : ""} income
          tax, both ways.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <Row label="Without donation" value={scenarioA.totalTax} />
        <Row label="With donation" value={scenarioB.totalTax} emphasis={saved} />

        <div
          className={cn(
            "flex items-baseline justify-between gap-3 border-t pt-3",
            saved ? "border-keep/25" : "border-border",
          )}
        >
          <span className="flex min-w-0 items-center gap-2 text-[0.9rem] font-semibold">
            {saved ? <ArrowDown className="size-4 shrink-0 text-keep" /> : null}
            {saved ? "You save" : "No difference"}
          </span>
          <span
            className={cn(
              "tnum shrink-0 text-lg font-semibold whitespace-nowrap",
              saved ? "text-keep-ink" : "text-muted-foreground",
            )}
          >
            {formatCurrency(Math.max(0, taxSavings))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0 text-[0.9rem] text-foreground/80">{label}</span>
      <span
        className={cn(
          "tnum shrink-0 whitespace-nowrap",
          emphasis ? "font-semibold text-keep-ink" : "font-medium",
        )}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}
