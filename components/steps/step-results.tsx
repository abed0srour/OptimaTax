"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import { BracketTable, type BasisLine } from "@/components/results/bracket-table";
import { FederalBreakdown } from "@/components/results/federal-breakdown";
import { KhumsCoverage } from "@/components/results/khums-coverage";
import { TaxChart } from "@/components/results/tax-chart";
import { Button } from "@/components/ui/button";
import { Note } from "@/components/wizard/note";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { ScenarioBreakdown, StateTaxEntry, TaxComparison } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StepResults({
  comparison,
  onBack,
  onRestart,
}: {
  comparison: TaxComparison;
  onBack: () => void;
  onRestart: () => void;
}) {
  const {
    taxYear,
    stateTaxYear,
    khums,
    scenarioA,
    scenarioB,
    taxSavings,
    stateEntry,
    donationEntered,
    donationCarryforward,
    charitableFloorAmount,
    agiLimitAmount,
    stateAllowsCharitableDeduction,
  } = comparison;

  const scenario = taxSavings > 0 ? scenarioB : scenarioA;
  const stateNoDeduction =
    donationEntered > 0 &&
    !stateAllowsCharitableDeduction &&
    stateEntry.tax_type !== "none";
  // States without an income tax owe nothing in any year, so only flag the rest.
  const stateYearDiffers = stateTaxYear !== taxYear && stateEntry.tax_type !== "none";

  return (
    <div className="animate-step-in space-y-3">
      <Verdict comparison={comparison} />

      {donationCarryforward > 0 ||
      stateNoDeduction ||
      charitableFloorAmount > 0 ||
      stateYearDiffers ? (
        <div className="space-y-2 px-1 py-2">
          {charitableFloorAmount > 0 ? (
            <Note>
              The first {formatCurrency(charitableFloorAmount)} of your gift (0.5%
              of income) isn&apos;t deductible under the 2026 floor.
            </Note>
          ) : null}
          {donationCarryforward > 0 ? (
            <Note>
              This kind of gift is deductible up to{" "}
              {formatPercent(comparison.charitableLimitRate, 0)} of income (
              {formatCurrency(agiLimitAmount)}). The other{" "}
              {formatCurrency(donationCarryforward)} carries forward up to five
              years.
            </Note>
          ) : null}
          {stateNoDeduction ? (
            <Note>
              {stateEntry.name} allows no charitable deduction, so the gift
              lowers your federal tax only.
            </Note>
          ) : null}
          {stateYearDiffers ? (
            <Note>
              {stateEntry.name} tax uses {stateTaxYear} state rates — {taxYear}{" "}
              state schedules aren&apos;t included yet.
            </Note>
          ) : null}
        </div>
      ) : null}

      <TaxChart comparison={comparison} />

      {khums.obligation > 0 ? (
        <KhumsCoverage khums={khums} donation={donationEntered} />
      ) : null}

      <div className="space-y-2 pt-2">
        <h2 className="px-1 text-sm font-medium text-muted-foreground">Details</h2>
        <FederalBreakdown scenario={scenario} />
        <BracketTable
          title={`${taxYear} federal brackets`}
          result={scenario.federal}
          basis={federalBasis(scenario, comparison.federalStandardDeduction)}
        />
        {stateEntry.tax_type !== "none" ? (
          <BracketTable
            title={`${stateTaxYear} ${stateEntry.name} brackets`}
            result={scenario.state}
            basis={stateBasis(scenario, stateEntry)}
          />
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-4 sm:flex sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-12 rounded-full bg-card px-5 text-[0.95rem] sm:h-11"
        >
          <ArrowLeft data-icon="inline-start" />
          Edit
        </Button>
        <Button
          type="button"
          onClick={onRestart}
          className="h-12 rounded-full px-5 text-[0.95rem] sm:h-11"
        >
          <RotateCcw data-icon="inline-start" />
          Start over
        </Button>
      </div>
    </div>
  );
}

/**
 * Names what came off AGI. The engine takes the standard deduction, the
 * standard deduction plus the gift, or an itemized total, and only the amount
 * says which — so read it back from that.
 */
function deductionLines(total: number, standard: number, gift: number): BasisLine[] {
  if (total === standard) {
    return [{ label: "Standard deduction", value: standard, deduction: true }];
  }
  if (gift > 0 && total === standard + gift) {
    return [
      { label: "Standard deduction", value: standard, deduction: true },
      { label: "Charitable gift", value: gift, deduction: true },
    ];
  }
  return [{ label: "Itemized deductions", value: total, deduction: true }];
}

function federalBasis(scenario: ScenarioBreakdown, standard: number): BasisLine[] {
  const lines: BasisLine[] = [
    { label: "Adjusted gross income", value: scenario.agi },
    ...deductionLines(scenario.federalDeduction, standard, scenario.donationApplied),
  ];
  // These brackets only see ordinary income; long-term gains take their own table.
  if (scenario.gainsTaxableIncome > 0) {
    lines.push(
      { label: "Long-term gains, taxed separately", value: scenario.gainsTaxableIncome, deduction: true },
      { label: "Taxed at ordinary rates", value: scenario.ordinaryTaxableIncome, total: true },
    );
  } else {
    lines.push({ label: "Taxable income", value: scenario.federalTaxableIncome, total: true });
  }
  return lines.filter((line) => line.total || line.value > 0);
}

function stateBasis(scenario: ScenarioBreakdown, state: StateTaxEntry): BasisLine[] {
  const gift = state.allowsCharitableDeduction ? scenario.donationApplied : 0;
  return [
    { label: "Adjusted gross income", value: scenario.agi },
    ...deductionLines(
      scenario.stateDeduction - state.personalExemption,
      state.standardDeduction,
      gift,
    ),
    { label: "Personal exemption", value: state.personalExemption, deduction: true },
    { label: "Taxable income", value: scenario.stateTaxableIncome, total: true },
  ].filter((line) => line.total || line.value > 0);
}

/** Names the winner outright, so nobody has to compare two bars to find it. */
function Verdict({ comparison }: { comparison: TaxComparison }) {
  const { taxYear, taxSavings, donationEntered, netCostOfGiving, scenarioA } =
    comparison;
  const better = taxSavings > 0;

  return (
    <section
      aria-labelledby="step-title"
      className={cn(
        "rounded-[1.75rem] border px-5 py-7 sm:px-8 sm:py-9",
        better ? "border-keep/25 bg-keep-soft" : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h1 id="step-title" className="text-sm font-medium text-muted-foreground">
          {better ? "Giving saves you" : donationEntered > 0 ? "No tax saved" : "Your total tax"}
        </h1>
        <span className="tnum shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium whitespace-nowrap text-muted-foreground">
          {taxYear} tax year
        </span>
      </div>

      <p
        className={cn(
          "tnum font-display mt-2 max-w-full text-[3.25rem] leading-[0.95] tracking-tight wrap-break-word sm:text-7xl",
          better && "text-keep-ink",
        )}
      >
        {formatCurrency(better ? taxSavings : scenarioA.totalTax)}
      </p>

      <p className="mt-4 max-w-prose text-[0.95rem] leading-relaxed text-muted-foreground">
        {better
          ? `on a ${formatCurrency(donationEntered)} gift — so it really costs you ${formatCurrency(Math.max(0, netCostOfGiving))}.`
          : donationEntered > 0
            ? "The gift doesn't lower this bill — taxable income is already zero, or your state grants no charitable deduction."
            : "Federal and state, with no donation."}
      </p>
    </section>
  );
}
