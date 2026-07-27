import { BracketTable } from "@/components/BracketTable";
import { Card, Row } from "@/components/Card";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { ScenarioBreakdown, StateTaxEntry } from "@/lib/types";

export function ScenarioCard({
  scenario,
  variant,
  eyebrow,
  caption,
  state,
  netProfit,
  footnote,
}: {
  scenario: ScenarioBreakdown;
  variant: "baseline" | "optimized";
  eyebrow: string;
  caption: string;
  state: StateTaxEntry;
  netProfit: number;
  footnote?: string;
}) {
  const optimized = variant === "optimized";

  const accent = optimized
    ? "border-emerald-300 ring-1 ring-emerald-500/20 dark:border-emerald-500/40 dark:ring-emerald-400/20"
    : "border-slate-200 dark:border-slate-800";

  const chipClass = optimized
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  const totalTone = optimized ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";

  const effectiveOnProfit = netProfit > 0 ? scenario.totalTax / netProfit : 0;

  return (
    <Card className={accent}>
      <header className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${chipClass}`}
          >
            {eyebrow}
          </span>
          {optimized && scenario.donationApplied > 0 ? (
            <span className="tnum text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              −{formatCurrency(scenario.donationApplied)} deducted
            </span>
          ) : null}
        </div>
        <h3 className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-slate-50">
          {scenario.label}
        </h3>
        <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">
          {caption}
        </p>
      </header>

      <div className="space-y-2.5 px-5 py-4">
        <Row
          label="Federal taxable income"
          value={formatCurrency(scenario.federalTaxableIncome)}
        />
        <Row
          label={`${state.code} taxable income`}
          value={
            state.tax_type === "none"
              ? "Not taxed"
              : formatCurrency(scenario.stateTaxableIncome)
          }
          tone={state.tax_type === "none" ? "muted" : "default"}
        />

        <div className="pt-1" />

        <Row
          label="Federal income tax"
          hint={`Marginal ${formatPercent(scenario.federal.marginalRate, 0)} · effective ${formatPercent(scenario.federal.effectiveRate, 1)}`}
          value={formatCurrency(scenario.federal.tax)}
        />
        <Row
          label={`${state.name} income tax`}
          hint={
            state.tax_type === "none"
              ? "No state income tax"
              : state.tax_type === "flat"
                ? `Flat ${formatPercent(state.rate ?? 0, 2)}`
                : `Marginal ${formatPercent(scenario.state.marginalRate, 2)}`
          }
          value={formatCurrency(scenario.state.tax)}
        />

        <div className="flex items-baseline justify-between gap-4 border-t border-slate-200 pt-3 dark:border-slate-800">
          <div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Total tax to government
            </span>
            <span className="block text-[11px] text-slate-400 dark:text-slate-500">
              {formatPercent(effectiveOnProfit, 1)} of net profit
            </span>
          </div>
          <span className={`tnum shrink-0 text-2xl font-bold tracking-tight ${totalTone}`}>
            {formatCurrency(scenario.totalTax)}
          </span>
        </div>

        <Row
          label="You keep after tax & giving"
          value={formatCurrency(scenario.retainedAfterGiving)}
          tone="muted"
        />
      </div>

      <div className="space-y-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
        <BracketTable title="Federal bracket walkthrough" result={scenario.federal} />
        {state.tax_type !== "none" ? (
          <BracketTable
            title={`${state.name} ${state.tax_type === "flat" ? "flat rate" : "bracket"} walkthrough`}
            result={scenario.state}
          />
        ) : null}
        {footnote ? (
          <p className="pt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            {footnote}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
