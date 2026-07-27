"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/Card";
import { CurrencyField, SelectField } from "@/components/Field";
import { KhumsPanel } from "@/components/KhumsPanel";
import { AllocationBar, SavingsBanner } from "@/components/Optimization";
import { ScenarioCard } from "@/components/ScenarioCard";
import { StatTile } from "@/components/StatTile";
import { formatCurrency, formatPercent, parseMoney, toMoneyInput } from "@/lib/format";
import { buildComparison, KHUMS_RATE } from "@/lib/tax";
import {
  dataNotes,
  federalStandardDeduction,
  federalTax,
  filingStatuses,
  states,
  stateTaxYear,
  taxYear,
} from "@/lib/taxData";
import type { DeductionMode, FilingStatus } from "@/lib/types";

const stateOptions = states.map((state) => ({
  value: state.code,
  label: `${state.name} (${state.code})`,
}));

const statusOptions = filingStatuses.map((status) => ({
  value: status.id,
  label: status.label,
}));

const deductionModes: { value: DeductionMode; label: string; blurb: string }[] = [
  {
    value: "stacked",
    label: "Stacked",
    blurb:
      "Standard deduction plus the full donation, as specified in the project brief. Generous, and simple to reason about.",
  },
  {
    value: "itemized",
    label: "IRS itemization",
    blurb:
      "The actual federal rule: you take the greater of the standard deduction or your itemized total, not both. Gifts below the standard deduction produce no extra benefit.",
  },
];

export default function Dashboard() {
  const [stateCode, setStateCode] = useState("CA");
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [incomeText, setIncomeText] = useState("120,000");
  const [expensesText, setExpensesText] = useState("20,000");
  const [donationText, setDonationText] = useState("20,000");
  const [deductionMode, setDeductionMode] = useState<DeductionMode>("stacked");

  const totalIncome = parseMoney(incomeText);
  const expenses = parseMoney(expensesText);
  const donation = parseMoney(donationText);

  const comparison = useMemo(
    () =>
      buildComparison({
        totalIncome,
        expenses,
        donation,
        filingStatus,
        stateCode,
        deductionMode,
      }),
    [totalIncome, expenses, donation, filingStatus, stateCode, deductionMode],
  );

  const {
    netProfit,
    khums,
    scenarioA,
    scenarioB,
    taxSavings,
    stateEntry,
    donationCarryforward,
    agiLimitAmount,
    stateAllowsCharitableDeduction,
  } = comparison;

  const activeMode = deductionModes.find((mode) => mode.value === deductionMode)!;
  const donationMatchesKhums =
    khums.obligation > 0 && Math.abs(donation - khums.obligation) < 1;

  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <main className="mx-auto w-full max-w-360 flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
          {/* ---------------- Inputs ---------------- */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader
                title="Your numbers"
                subtitle="Everything recalculates as you type"
              />

              <div className="space-y-5 px-5 py-5">
                <SelectField
                  label="State of residence"
                  value={stateCode}
                  options={stateOptions}
                  onChange={setStateCode}
                  hint={stateDescription(stateEntry.tax_type, stateEntry.rate)}
                />

                <SelectField
                  label="Federal filing status"
                  value={filingStatus}
                  options={statusOptions}
                  onChange={(value) => setFilingStatus(value as FilingStatus)}
                  hint={`Standard deduction ${formatCurrency(
                    federalStandardDeduction(filingStatus),
                  )} for ${taxYear}`}
                />

                <div className="space-y-5 border-t border-slate-200 pt-5 dark:border-slate-800">
                  <CurrencyField
                    label="Annual income / gross revenue"
                    value={incomeText}
                    onChange={setIncomeText}
                    placeholder="120,000"
                  />

                  <CurrencyField
                    label="Annual operating expenses"
                    value={expensesText}
                    onChange={setExpensesText}
                    placeholder="20,000"
                    hint="Deductible business or living costs subtracted before profit"
                  />

                  <CurrencyField
                    label="Charitable donation (x)"
                    value={donationText}
                    onChange={setDonationText}
                    placeholder="0"
                    accent="indigo"
                    hint="Cash gift to a 501(c)(3), all or part of which fulfils khums"
                    action={{
                      label: donationMatchesKhums ? "✓ Matches khums" : "Match khums (1/5)",
                      title: `Set the donation to ${formatCurrency(khums.obligation)}`,
                      onClick: () => setDonationText(toMoneyInput(khums.obligation)),
                    }}
                  />
                </div>

                <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Deduction model
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                    {deductionModes.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setDeductionMode(mode.value)}
                        aria-pressed={deductionMode === mode.value}
                        className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                          deductionMode === mode.value
                            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-50"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                    {activeMode.blurb}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* ---------------- Results ---------------- */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatTile
                label="Net profit"
                value={formatCurrency(netProfit)}
                detail="Income minus expenses"
              />
              <StatTile
                label={`Khums due (${formatPercent(KHUMS_RATE, 0)})`}
                value={formatCurrency(khums.obligation)}
                detail="One fifth of the year's surplus"
                tone="indigo"
              />
              <StatTile
                label="Tax without donation"
                value={formatCurrency(scenarioA.totalTax)}
                detail={`${formatPercent(
                  netProfit > 0 ? scenarioA.totalTax / netProfit : 0,
                  1,
                )} of net profit`}
                tone="rose"
              />
              <StatTile
                label="Tax saved by giving"
                value={formatCurrency(taxSavings)}
                detail={`Bill drops to ${formatCurrency(scenarioB.totalTax)}`}
                tone="emerald"
              />
            </div>

            <SavingsBanner comparison={comparison} />

            {netProfit <= 0 ? (
              <Notice tone="amber">
                Expenses meet or exceed income, so there is no net profit to tax and no
                khums obligation. Adjust the figures on the left to model a profitable
                year.
              </Notice>
            ) : null}

            {donationCarryforward > 0 ? (
              <Notice tone="amber">
                Your gift exceeds the federal ceiling for cash donations to public
                charities —{" "}
                {formatPercent(
                  federalTax.charitable_deduction_limits.cash_public_charity_agi_limit,
                  0,
                )}{" "}
                of income, or {formatCurrency(agiLimitAmount)} here. Only that much is
                deducted this year; the remaining {formatCurrency(donationCarryforward)}{" "}
                carries forward for up to five years.
              </Notice>
            ) : null}

            {!stateAllowsCharitableDeduction && stateEntry.tax_type !== "none" ? (
              <Notice tone="slate">
                {stateEntry.name} grants no deduction for charitable contributions, so the
                donation lowers your federal bill only. State tax is identical in both
                scenarios.
              </Notice>
            ) : null}

            <div className="grid gap-5 xl:grid-cols-2">
              <ScenarioCard
                scenario={scenarioA}
                variant="baseline"
                eyebrow="Scenario A"
                caption="Full net profit exposed to tax, nothing given away."
                state={stateEntry}
                netProfit={netProfit}
              />
              <ScenarioCard
                scenario={scenarioB}
                variant="optimized"
                eyebrow="Scenario B"
                caption="Khums routed through a 501(c)(3), deducted before tax."
                state={stateEntry}
                netProfit={netProfit}
                footnote={
                  donation > 0
                    ? `Khums coverage: ${formatCurrency(khums.fulfilled)} of ${formatCurrency(
                        khums.obligation,
                      )} (${formatPercent(khums.coverage, 0)}).`
                    : undefined
                }
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <KhumsPanel khums={khums} donation={donation} netProfit={netProfit} />
              <AllocationBar comparison={comparison} />
            </div>

            <Disclaimer stateNote={stateEntry.note} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex w-full max-w-360 flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-sm font-black text-white shadow-sm">
            OT
          </span>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
              OptimaTax
            </h1>
            <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
              Tax visualizer · donation optimizer · khums integration
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Pill>Tax year {taxYear}</Pill>
          <Pill>{states.length} jurisdictions</Pill>
        </div>
      </div>
    </header>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      {children}
    </span>
  );
}

function Notice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "amber" | "slate";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";

  return (
    <div className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${toneClass}`}>
      {children}
    </div>
  );
}

function Disclaimer({ stateNote }: { stateNote?: string }) {
  return (
    <footer className="rounded-2xl border border-slate-200 bg-slate-100/60 px-5 py-4 text-[11px] leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
      <p className="mb-2 font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
        Scope and limitations
      </p>
      <ul className="list-disc space-y-1 pl-4">
        <li>
          Ordinary income only. Payroll and self-employment tax, AMT, QBI, credits, and
          phaseouts are not modeled. The {taxYear} dataset also carries long-term capital
          gains brackets, the {formatPercent(
            federalTax.net_investment_income_tax.rate,
            1,
          )}{" "}
          net investment income tax, and the{" "}
          {formatPercent(federalTax.additional_medicare_tax.rate, 1)} additional Medicare
          tax — none of which this dashboard applies yet.
        </li>
        <li className="font-medium text-slate-700 dark:text-slate-300">
          State brackets in this dataset are <strong>single-filer schedules only</strong>,
          applied regardless of the filing status you select. Married-filing-jointly
          thresholds are wider in many states, so joint filers will see state tax
          overstated here.
        </li>
        <li className="font-medium text-slate-700 dark:text-slate-300">
          The dataset carries <strong>no state standard deductions or exemptions</strong>,
          so state taxable income is the full net profit less any deductible gift. Real
          state bills will generally be lower.
        </li>
        <li>
          State figures cover state-level income tax only — city and county income taxes
          (NYC, Maryland counties, Ohio municipalities, and others) are excluded.
        </li>
        <li>
          Khums rulings vary by school and marja&apos;. This tool computes the common 1/5
          of annual surplus; it does not decide whether a given 501(c)(3) is a valid
          recipient of sahm al-imam or sahm al-sada.
        </li>
        {stateNote ? <li>{stateNote}</li> : null}
        <li>
          Federal: {dataNotes.federalSource}. State schedules are for{" "}
          {stateTaxYear} — {dataNotes.stateNotes}
        </li>
        <li className="font-medium text-slate-700 dark:text-slate-300">
          Educational estimate, not tax or religious advice. Confirm with a qualified CPA
          and your marja&apos; before acting.
        </li>
      </ul>
    </footer>
  );
}

function stateDescription(taxType: string, rate?: number): string {
  if (taxType === "none") return "No state income tax on wage or business income";
  if (taxType === "flat") return `Flat rate of ${formatPercent(rate ?? 0, 2)}`;
  return "Graduated brackets applied progressively";
}
