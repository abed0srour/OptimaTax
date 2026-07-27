import { Card, CardHeader } from "@/components/Card";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { TaxComparison } from "@/lib/types";

/** The headline metric: what the donation actually bought you, in dollars. */
export function SavingsBanner({ comparison }: { comparison: TaxComparison }) {
  const { taxSavings, donationEntered, netCostOfGiving, givingDiscount } = comparison;
  const active = donationEntered > 0 && taxSavings > 0;

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm ${
        active
          ? "border-emerald-300 bg-linear-to-br from-emerald-50 via-emerald-50 to-teal-50 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:via-emerald-500/5 dark:to-teal-500/10"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      <div className="grid gap-px bg-slate-200/60 sm:grid-cols-3 dark:bg-slate-800/60">
        <Metric
          label="Legal tax savings"
          value={formatCurrency(taxSavings)}
          detail="Federal + state tax avoided by deducting the gift"
          hero
          active={active}
        />
        <Metric
          label="Real cost of giving"
          value={formatCurrency(Math.max(0, netCostOfGiving))}
          detail={`You give ${formatCurrency(donationEntered)}; the tax code absorbs ${formatCurrency(taxSavings)}`}
          active={active}
        />
        <Metric
          label="Effective discount"
          value={formatPercent(givingDiscount, 1)}
          detail="Share of every donated dollar returned as tax relief"
          active={active}
        />
      </div>

      {donationEntered > 0 ? (
        <p
          className={`px-5 py-3 text-xs leading-relaxed ${
            active
              ? "bg-emerald-100/60 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200"
              : "bg-slate-50 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400"
          }`}
        >
          {active
            ? `Giving ${formatCurrency(donationEntered)} to a 501(c)(3) costs you ${formatCurrency(
                Math.max(0, netCostOfGiving),
              )} out of pocket, because ${formatCurrency(
                taxSavings,
              )} would otherwise have gone to the government anyway.`
            : "At this income and deduction level the donation does not reduce the tax bill further — taxable income is already at or below zero, or the state grants no charitable deduction."}
        </p>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  hero = false,
  active,
}: {
  label: string;
  value: string;
  detail: string;
  hero?: boolean;
  active: boolean;
}) {
  return (
    <div className="bg-white/70 px-5 py-4 backdrop-blur-sm dark:bg-slate-900/70">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p
        className={`tnum mt-1 font-bold tracking-tight ${hero ? "text-3xl" : "text-2xl"} ${
          hero && active
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-slate-900 dark:text-slate-50"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
        {detail}
      </p>
    </div>
  );
}

/**
 * Side-by-side stacked bars showing how the same net profit splits between the
 * government, the charity, and the taxpayer under each scenario.
 */
export function AllocationBar({ comparison }: { comparison: TaxComparison }) {
  const { netProfit, scenarioA, scenarioB, donationEntered } = comparison;

  const rows = [
    {
      key: "a",
      title: "Without donation",
      segments: [
        { label: "To government", value: scenarioA.totalTax, className: "bg-rose-500" },
        { label: "You keep", value: Math.max(0, scenarioA.retainedAfterGiving), className: "bg-slate-400 dark:bg-slate-600" },
      ],
    },
    {
      key: "b",
      title: "With donation",
      segments: [
        { label: "To government", value: scenarioB.totalTax, className: "bg-rose-500" },
        { label: "To charity / khums", value: donationEntered, className: "bg-indigo-500" },
        { label: "You keep", value: Math.max(0, scenarioB.retainedAfterGiving), className: "bg-emerald-500" },
      ],
    },
  ];

  const scale = Math.max(
    netProfit,
    ...rows.map((row) => row.segments.reduce((sum, s) => sum + s.value, 0)),
    1,
  );

  return (
    <Card>
      <CardHeader
        title="Where your net profit goes"
        subtitle={`Both bars represent the same ${formatCurrency(netProfit)} of net profit`}
      />
      <div className="space-y-5 px-5 py-4">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {row.title}
              </span>
              <span className="tnum text-xs text-slate-500 dark:text-slate-400">
                {formatCurrency(netProfit)}
              </span>
            </div>
            <div className="flex h-7 w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
              {row.segments
                .filter((segment) => segment.value > 0)
                .map((segment) => (
                  <div
                    key={segment.label}
                    className={`${segment.className} h-full transition-[width] duration-300 ease-out`}
                    style={{ width: `${(segment.value / scale) * 100}%` }}
                    title={`${segment.label}: ${formatCurrency(segment.value)}`}
                  />
                ))}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              {row.segments
                .filter((segment) => segment.value > 0)
                .map((segment) => (
                  <span
                    key={segment.label}
                    className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-sm ${segment.className}`} />
                    {segment.label}
                    <span className="tnum font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(segment.value)}
                    </span>
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
