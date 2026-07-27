import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { TaxComparison } from "@/lib/types";

/**
 * Two stacked bars over the same net profit: how it splits between the
 * government, the charity, and you — before the gift and after it.
 */
export function Allocation({ comparison }: { comparison: TaxComparison }) {
  const { netProfit, scenarioA, scenarioB, donationEntered } = comparison;

  const rows = [
    {
      key: "a",
      title: "Without donation",
      segments: [
        { label: "To government", value: scenarioA.totalTax, className: "bg-tax" },
        {
          label: "You keep",
          value: Math.max(0, scenarioA.retainedAfterGiving),
          className: "bg-foreground/25",
        },
      ],
    },
    {
      key: "b",
      title: "With donation",
      segments: [
        { label: "To government", value: scenarioB.totalTax, className: "bg-tax" },
        { label: "To charity / khums", value: donationEntered, className: "bg-give" },
        {
          label: "You keep",
          value: Math.max(0, scenarioB.retainedAfterGiving),
          className: "bg-keep",
        },
      ],
    },
  ];

  const scale = Math.max(
    netProfit,
    ...rows.map((row) => row.segments.reduce((sum, s) => sum + s.value, 0)),
    1,
  );

  return (
    <Card className="rounded-2xl shadow-sm ring-foreground/8 [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>Where your net profit goes</CardTitle>
        <CardDescription>
          Both bars represent the same {formatCurrency(netProfit)}.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {rows.map((row) => {
          const visible = row.segments.filter((segment) => segment.value > 0);

          return (
            <div key={row.key}>
              <p className="mb-1.5 text-sm font-medium">{row.title}</p>
              <div className="flex h-7 w-full gap-0.5 overflow-hidden rounded-lg bg-muted">
                {visible.map((segment) => (
                  <div
                    key={segment.label}
                    className={`${segment.className} h-full transition-[width] duration-300 ease-out`}
                    style={{ width: `${(segment.value / scale) * 100}%` }}
                    title={`${segment.label}: ${formatCurrency(segment.value)}`}
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {visible.map((segment) => (
                  <span
                    key={segment.label}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${segment.className}`}
                    />
                    {segment.label}
                    <span className="tnum font-semibold text-foreground">
                      {formatCurrency(segment.value)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
