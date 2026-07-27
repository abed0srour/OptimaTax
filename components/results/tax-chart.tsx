import { Disclosure } from "@/components/ui-extras/disclosure";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { TaxComparison } from "@/lib/types";
import { cn } from "@/lib/utils";

const SERIES = [
  { key: "federal", label: "Federal", className: "bg-chart-1" },
  { key: "state", label: "State", className: "bg-chart-2" },
] as const;

/**
 * Both cases on one scale. Stacked horizontal bars rather than two numbers,
 * because the point is the gap between them — and the federal/state split
 * explains where the gap comes from.
 */
export function TaxChart({ comparison }: { comparison: TaxComparison }) {
  const { scenarioA, scenarioB, stateEntry } = comparison;

  const rows = [
    { key: "a", title: "Without donation", scenario: scenarioA },
    { key: "b", title: "With donation", scenario: scenarioB },
  ];

  // Both bars share one scale, so their lengths are directly comparable.
  const scale = Math.max(scenarioA.totalTax, scenarioB.totalTax, 1);

  return (
    <Card className="rounded-2xl shadow-sm ring-foreground/8 [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>Your tax, both ways</CardTitle>
        <CardDescription>Federal and {stateEntry.name} income tax.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {SERIES.map((series) => (
            <li
              key={series.key}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className={cn("size-2.5 rounded-full", series.className)} />
              {series.label}
            </li>
          ))}
        </ul>

        <div className="space-y-4">
          {rows.map((row) => {
            const { totalTax, federal, state } = row.scenario;
            const segments = [
              { ...SERIES[0], value: federal.tax },
              { ...SERIES[1], value: state.tax },
            ].filter((segment) => segment.value > 0);

            return (
              <div key={row.key}>
                {/*
                 * The total sits above the bar rather than at its tip: a
                 * seven-figure label past a full-width bar would run into the
                 * card's clipped edge, and stacking them keeps the two totals
                 * aligned for comparison.
                 */}
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <p className="min-w-0 text-sm font-medium">{row.title}</p>
                  <p className="tnum shrink-0 text-sm font-semibold whitespace-nowrap">
                    {formatCurrency(totalTax)}
                  </p>
                </div>

                {totalTax > 0 ? (
                  <div
                    className="flex h-6 gap-0.5 transition-[width] duration-300 ease-out"
                    style={{ width: `${(totalTax / scale) * 100}%` }}
                  >
                    {segments.map((segment, index) => (
                      <div
                        key={segment.key}
                        className={cn(
                          "h-full",
                          segment.className,
                          index === segments.length - 1 && "rounded-r-[4px]",
                        )}
                        style={{ flexGrow: segment.value }}
                        title={`${segment.label}: ${formatCurrency(segment.value)}`}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="flex h-6 items-center text-sm text-muted-foreground">
                    No tax due
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <Disclosure title="View as table">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 px-2 text-muted-foreground">Case</TableHead>
                <TableHead className="h-8 px-2 text-right text-muted-foreground">
                  Federal
                </TableHead>
                <TableHead className="h-8 px-2 text-right text-muted-foreground">
                  State
                </TableHead>
                <TableHead className="h-8 px-2 text-right text-muted-foreground">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="py-2">{row.title}</TableCell>
                  <TableCell className="tnum py-2 text-right">
                    {formatCurrency(row.scenario.federal.tax)}
                  </TableCell>
                  <TableCell className="tnum py-2 text-right">
                    {formatCurrency(row.scenario.state.tax)}
                  </TableCell>
                  <TableCell className="tnum py-2 text-right font-semibold">
                    {formatCurrency(row.scenario.totalTax)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Disclosure>
      </CardContent>
    </Card>
  );
}
