"use client";

import type { ReactNode } from "react";
import {
  ArrowLeft,
  Info,
  Landmark,
  ListTree,
  MapPin,
  RotateCcw,
  TrendingDown,
} from "lucide-react";
import { BracketTable } from "@/components/results/bracket-table";
import { KhumsCoverage } from "@/components/results/khums-coverage";
import { MoneyFlow } from "@/components/results/money-flow";
import { TaxCompare } from "@/components/results/tax-compare";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Disclosure } from "@/components/ui-extras/disclosure";
import { formatCurrency, formatPercent } from "@/lib/format";
import { federalTax } from "@/lib/taxData";
import type { TaxComparison } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Read top to bottom: the one number that matters, then where the money went,
 * then whether giving helped. Everything a curious reader might want — bracket
 * walkthroughs, both-ways figures — sits behind a single toggle at the bottom,
 * so the default view stays short enough to take in at a glance.
 */
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
    khums,
    netProfit,
    scenarioA,
    scenarioB,
    taxSavings,
    stateEntry,
    donationEntered,
    donationCarryforward,
    agiLimitAmount,
    stateAllowsCharitableDeduction,
  } = comparison;

  const gave = donationEntered > 0;
  const saved = taxSavings > 0;
  const scenario = gave ? scenarioB : scenarioA;

  return (
    <div className="animate-step-in space-y-4">
      <Verdict comparison={comparison} />

      <MoneyFlow
        netProfit={netProfit}
        tax={scenario.totalTax}
        donation={donationEntered}
        kept={scenario.retainedAfterGiving}
      />

      {gave ? <TaxCompare comparison={comparison} /> : null}

      {khums.obligation > 0 ? (
        <KhumsCoverage khums={khums} donation={donationEntered} />
      ) : null}

      {donationCarryforward > 0 || (gave && !stateAllowsCharitableDeduction && stateEntry.tax_type !== "none") ? (
        <div className="space-y-2">
          {donationCarryforward > 0 ? (
            <Note title="Part of the gift carries forward">
              Cash gifts are deductible up to{" "}
              {formatPercent(
                federalTax.charitable_deduction_limits.cash_public_charity_agi_limit,
                0,
              )}{" "}
              of income — {formatCurrency(agiLimitAmount)} here. The remaining{" "}
              {formatCurrency(donationCarryforward)} carries forward up to five
              years.
            </Note>
          ) : null}

          {gave &&
          !stateAllowsCharitableDeduction &&
          stateEntry.tax_type !== "none" ? (
            <Note title={`${stateEntry.name} allows no charitable deduction`}>
              The donation lowers your federal bill only.
            </Note>
          ) : null}
        </div>
      ) : null}

      {/*
       * One toggle for every remaining figure. Two disclosures side by side
       * invited the reader to open both and compare tables they never asked
       * for; one keeps the detail available without advertising it.
       */}
      <Disclosure
        icon={<ListTree />}
        title="Full breakdown"
        aside="Bracket by bracket"
      >
        <div className="space-y-5">
          <BracketTable
            title="Federal brackets"
            icon={<Landmark />}
            result={saved ? scenarioB.federal : scenarioA.federal}
          />

          {stateEntry.tax_type !== "none" ? (
            <BracketTable
              title={`${stateEntry.name} brackets`}
              icon={<MapPin />}
              result={saved ? scenarioB.state : scenarioA.state}
            />
          ) : null}
        </div>
      </Disclosure>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="h-10 w-full px-3 text-[0.9rem] sm:w-auto"
        >
          <ArrowLeft data-icon="inline-start" />
          Change my answers
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onRestart}
          className="h-10 w-full px-4 text-[0.9rem] sm:w-auto"
        >
          <RotateCcw data-icon="inline-start" />
          Start over
        </Button>
      </div>
    </div>
  );
}

/**
 * The hero figure. Which number leads depends on the situation: a saving when
 * there is one, the bill itself when there is not — never a prominent "$0",
 * which reads as an error rather than an answer.
 */
function Verdict({ comparison }: { comparison: TaxComparison }) {
  const {
    taxSavings,
    donationEntered,
    netCostOfGiving,
    netProfit,
    scenarioA,
    scenarioB,
  } = comparison;

  const gave = donationEntered > 0;
  const saved = taxSavings > 0;
  const scenario = gave ? scenarioB : scenarioA;

  const eyebrow = saved ? "You saved" : "Total tax due";
  const figure = saved ? taxSavings : scenario.totalTax;

  return (
    <Card
      className={cn(
        "rounded-2xl shadow-sm [--card-spacing:--spacing(6)]",
        saved ? "bg-keep-soft ring-keep/25" : "ring-foreground/8",
      )}
    >
      <CardContent className="space-y-2">
        <p className="flex items-center gap-2 text-[0.8rem] font-semibold tracking-wider text-muted-foreground uppercase">
          {saved ? <TrendingDown className="size-4 shrink-0 text-keep" /> : null}
          {eyebrow}
        </p>

        {/*
         * Proportional figures, not `tnum` — equal-width digits look loose at
         * display sizes. Steps down on narrow screens so seven figures still fit.
         */}
        <p
          className={cn(
            "max-w-full text-4xl leading-none font-semibold tracking-tight wrap-break-word sm:text-5xl md:text-6xl",
            saved ? "text-keep-ink" : "text-foreground",
          )}
        >
          {formatCurrency(figure)}
        </p>

        <p className="max-w-prose text-[0.95rem] leading-relaxed text-foreground/80">
          {saved ? (
            <>
              by donating {formatCurrency(donationEntered)} to a 501(c)(3). The
              gift really costs you {formatCurrency(Math.max(0, netCostOfGiving))}.
            </>
          ) : gave ? (
            whyNoSaving(comparison)
          ) : (
            <>
              on {formatCurrency(netProfit)} of net profit. You keep{" "}
              {formatCurrency(scenario.afterTaxIncome)}.
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Why a gift that was actually made changed nothing. Naming the real reason
 * matters: "your income is already zero" is simply false when a bill is due,
 * and the itemization case below is by far the most common cause.
 */
function whyNoSaving(comparison: TaxComparison): string {
  const { scenarioA, scenarioB, deductionMode, stateEntry, donationEntered } =
    comparison;

  if (scenarioA.federalTaxableIncome <= 0) {
    return "Your taxable income is already at zero, so there is no federal tax left for the gift to lower.";
  }

  // Under IRS itemization a gift smaller than the standard deduction is simply
  // not taken, so federal taxable income comes out identical either way.
  if (
    deductionMode === "itemized" &&
    scenarioA.federalTaxableIncome === scenarioB.federalTaxableIncome
  ) {
    return `Under IRS itemization you take the greater of the standard deduction or your itemized total — and ${formatCurrency(
      donationEntered,
    )} is the smaller of the two, so it adds no federal benefit.${
      stateEntry.tax_type === "none"
        ? ` ${stateEntry.name} has no income tax either.`
        : ""
    }`;
  }

  if (stateEntry.tax_type === "none") {
    return `The gift does not lower this bill, and ${stateEntry.name} has no income tax for it to offset.`;
  }

  return "The gift does not lower this bill — your state grants no charitable deduction, and it produced no federal benefit.";
}

/** A caveat worth reading, sized as an aside rather than a warning banner. */
function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-note/30 bg-note-soft px-4 py-3">
      <Info className="mt-0.5 size-4 shrink-0 text-note-ink" />
      <p className="text-[0.85rem] leading-relaxed text-note-ink">
        <span className="font-semibold">{title}.</span> {children}
      </p>
    </div>
  );
}
