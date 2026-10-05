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
  const { scenarioA, scenarioB } = comparison;

  const rows = [
    { key: "a", title: "Without giving", scenario: scenarioA },
    { key: "b", title: "With giving", scenario: scenarioB },
  ];

  // Both bars share one scale, so their lengths are directly comparable.
  const scale = Math.max(scenarioA.totalTax, scenarioB.totalTax, 1);

  return (
    <section className="rounded-[1.75rem] border border-border bg-card px-5 py-5 sm:px-8 sm:py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className="text-[0.95rem] font-medium">Tax, both ways</h2>
        <ul className="flex gap-3">
          {SERIES.map((series) => (
            <li
              key={series.key}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className={cn("size-2 rounded-full", series.className)} />
              {series.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 space-y-4">
        {rows.map((row) => {
          const { totalTax, totalFederalTax, state } = row.scenario;
          // Every federal tax, not just the bracket tax — otherwise the
          // segments would not add up to the total printed above them.
          const segments = [
            { ...SERIES[0], value: totalFederalTax },
            { ...SERIES[1], value: state.tax },
          ].filter((segment) => segment.value > 0);

          return (
            <div key={row.key}>
              {/*
               * The total sits above the bar rather than at its tip, so a
               * seven-figure label never runs past the sheet's edge.
               */}
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <p className="min-w-0 text-sm text-muted-foreground">{row.title}</p>
                <p className="tnum shrink-0 text-sm font-semibold whitespace-nowrap">
                  {formatCurrency(totalTax)}
                </p>
              </div>

              {totalTax > 0 ? (
                <div
                  role="img"
                  aria-label={segments
                    .map((segment) => `${segment.label} ${formatCurrency(segment.value)}`)
                    .join(", ")}
                  className="flex h-3 gap-0.5 overflow-hidden rounded-full transition-[width] duration-300 ease-out"
                  style={{ width: `${(totalTax / scale) * 100}%` }}
                >
                  {segments.map((segment) => (
                    <div
                      key={segment.key}
                      className={cn("h-full", segment.className)}
                      style={{ flexGrow: segment.value }}
                      title={`${segment.label}: ${formatCurrency(segment.value)}`}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tax due</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
