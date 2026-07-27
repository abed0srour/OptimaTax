import { BracketTable } from "@/components/results/bracket-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatPercent, formatSignedCurrency } from "@/lib/format";
import type { TaxComparison } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The two scenarios laid side by side, line for line, so the effect of the gift
 * is a difference you can read across a row rather than hold in your head.
 */
export function Comparison({ comparison }: { comparison: TaxComparison }) {
  const { scenarioA, scenarioB, stateEntry, netProfit, donationEntered } = comparison;
  const stateTaxed = stateEntry.tax_type !== "none";

  const rows: {
    label: string;
    a: string;
    b: string;
    emphasis?: boolean;
    hint?: string;
  }[] = [
    {
      label: "Federal taxable income",
      a: formatCurrency(scenarioA.federalTaxableIncome),
      b: formatCurrency(scenarioB.federalTaxableIncome),
    },
    {
      label: `${stateEntry.code} taxable income`,
      a: stateTaxed ? formatCurrency(scenarioA.stateTaxableIncome) : "Not taxed",
      b: stateTaxed ? formatCurrency(scenarioB.stateTaxableIncome) : "Not taxed",
    },
    {
      label: "Federal income tax",
      hint: `Top bracket ${formatPercent(scenarioB.federal.marginalRate, 0)} after the gift`,
      a: formatCurrency(scenarioA.federal.tax),
      b: formatCurrency(scenarioB.federal.tax),
    },
    {
      label: `${stateEntry.name} income tax`,
      hint: stateTaxed ? undefined : "No state income tax",
      a: formatCurrency(scenarioA.state.tax),
      b: formatCurrency(scenarioB.state.tax),
    },
    {
      label: "Total tax",
      hint: `${formatPercent(
        netProfit > 0 ? scenarioB.totalTax / netProfit : 0,
        1,
      )} of net profit with the gift`,
      a: formatCurrency(scenarioA.totalTax),
      b: formatCurrency(scenarioB.totalTax),
      emphasis: true,
    },
    {
      label: "You keep, after tax and giving",
      a: formatCurrency(scenarioA.retainedAfterGiving),
      b: formatCurrency(scenarioB.retainedAfterGiving),
    },
  ];

  return (
    <Card className="rounded-2xl shadow-sm ring-foreground/8 [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>Side by side</CardTitle>
        <CardDescription>
          The same {formatCurrency(netProfit)} of net profit, taxed both ways.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-120 border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-2/5 pb-2 text-left text-xs font-medium text-muted-foreground">
                  &nbsp;
                </th>
                <th className="px-3 pb-2 text-right text-xs font-medium text-muted-foreground">
                  Without donation
                </th>
                <th className="rounded-t-lg bg-keep-soft px-3 pb-2 text-right text-xs font-semibold text-keep-ink">
                  With donation
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className={cn(
                    "border-t border-border",
                    row.emphasis && "border-t-2 border-t-foreground/15",
                  )}
                >
                  <td className="py-2.5 pr-3 align-top">
                    <span
                      className={cn(
                        "block leading-snug",
                        row.emphasis ? "font-semibold" : "text-foreground/80",
                      )}
                    >
                      {row.label}
                    </span>
                    {row.hint ? (
                      <span className="block text-xs text-muted-foreground">
                        {row.hint}
                      </span>
                    ) : null}
                  </td>
                  <td
                    className={cn(
                      "tnum px-3 py-2.5 text-right align-top whitespace-nowrap",
                      row.emphasis ? "font-semibold" : "text-foreground/80",
                    )}
                  >
                    {row.a}
                  </td>
                  <td
                    className={cn(
                      "tnum bg-keep-soft px-3 py-2.5 text-right align-top whitespace-nowrap",
                      row.emphasis
                        ? "text-base font-semibold text-keep-ink"
                        : "font-medium",
                    )}
                  >
                    {row.b}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-3 text-right text-xs text-muted-foreground">
                  Difference in total tax
                </td>
                <td className="rounded-b-lg bg-keep-soft px-3 pt-3 pb-2 text-right">
                  <Badge className="tnum bg-keep text-primary-foreground">
                    {formatSignedCurrency(scenarioB.totalTax - scenarioA.totalTax)}
                  </Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {donationEntered > 0 && comparison.deductibleDonation > 0 ? (
          <p className="text-xs text-muted-foreground">
            {formatCurrency(comparison.deductibleDonation)} of the gift is deducted
            before tax in the right-hand column.
          </p>
        ) : null}

        <div className="space-y-2">
          <BracketTable
            title="Federal brackets, with the donation"
            result={scenarioB.federal}
          />
          {stateTaxed ? (
            <BracketTable
              title={`${stateEntry.name} ${
                stateEntry.tax_type === "flat" ? "flat rate" : "brackets"
              }, with the donation`}
              result={scenarioB.state}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
