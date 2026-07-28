import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * A slice worth less than this share of the whole would render as a hairline,
 * so it is floored — the labelled rows below carry the exact figures.
 */
const MIN_VISIBLE_SHARE = 0.02;

const SEGMENTS = [
  { key: "tax", label: "Tax", fill: "bg-tax" },
  { key: "give", label: "Donation", fill: "bg-give" },
  { key: "keep", label: "You keep", fill: "bg-keep" },
] as const;

/**
 * The whole year in one bar: every dollar of net profit either goes to tax,
 * goes to the charity, or stays with you. Three parts of one whole, so it
 * answers "where did my money actually go" without any cross-referencing.
 */
export function MoneyFlow({
  netProfit,
  tax,
  donation,
  kept,
}: {
  netProfit: number;
  tax: number;
  donation: number;
  kept: number;
}) {
  const values = { tax, give: donation, keep: kept } as const;

  const rows = SEGMENTS.map((segment) => ({
    ...segment,
    value: Math.max(0, values[segment.key]),
  })).filter((row) => row.value > 0);

  const total = rows.reduce((sum, row) => sum + row.value, 0);
  if (total <= 0) return null;

  // "Three ways" is a lie when there was no donation to make a third slice.
  const split = rows.length === 3 ? "split three ways" : "split two ways";

  return (
    <Card className="rounded-2xl shadow-sm ring-foreground/8 [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>Where your money goes</CardTitle>
        <CardDescription>
          Your {formatCurrency(netProfit)} net profit, {split}.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 2px surface gaps do the separating — no borders drawn on the marks. */}
        <div className="flex h-6 gap-0.5" role="presentation">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className={cn(
                "h-full",
                row.fill,
                index === 0 && "rounded-l-[4px]",
                index === rows.length - 1 && "rounded-r-[4px]",
              )}
              style={{
                flexGrow: Math.max(row.value / total, MIN_VISIBLE_SHARE),
              }}
            />
          ))}
        </div>

        {/*
         * Doubles as the legend and as direct labels, so identity never rests
         * on colour alone.
         */}
        <dl className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.key} className="flex items-baseline justify-between gap-3">
              <dt className="flex min-w-0 items-center gap-2 text-[0.9rem] text-foreground/80">
                <span className={cn("size-2.5 shrink-0 rounded-full", row.fill)} />
                {row.label}
              </dt>
              <dd className="flex shrink-0 items-baseline gap-2 whitespace-nowrap">
                <span className="tnum text-xs text-muted-foreground">
                  {Math.round((row.value / total) * 100)}%
                </span>
                <span className="tnum text-[0.95rem] font-semibold">
                  {formatCurrency(row.value)}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
