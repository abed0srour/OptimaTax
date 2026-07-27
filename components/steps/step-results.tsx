"use client";

import { ArrowLeft, Info, RotateCcw, TriangleAlert } from "lucide-react";
import { Allocation } from "@/components/results/allocation";
import { Comparison } from "@/components/results/comparison";
import { KhumsSummary } from "@/components/results/khums-summary";
import { Limitations } from "@/components/results/limitations";
import { Headline, Stat } from "@/components/results/summary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/format";
import { KHUMS_RATE } from "@/lib/tax";
import { federalTax } from "@/lib/taxData";
import type { TaxComparison } from "@/lib/types";

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
    netProfit,
    khums,
    scenarioA,
    scenarioB,
    taxSavings,
    stateEntry,
    donationEntered,
    donationCarryforward,
    agiLimitAmount,
    stateAllowsCharitableDeduction,
  } = comparison;

  return (
    <div className="animate-step-in space-y-4">
      <Headline comparison={comparison} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Net profit"
          value={formatCurrency(netProfit)}
          detail="Income minus expenses"
        />
        <Stat
          label={`Khums (${formatPercent(KHUMS_RATE, 0)})`}
          value={formatCurrency(khums.obligation)}
          detail="One fifth of the surplus"
          tone="give"
        />
        <Stat
          label="Tax without giving"
          value={formatCurrency(scenarioA.totalTax)}
          detail={`${formatPercent(
            netProfit > 0 ? scenarioA.totalTax / netProfit : 0,
            1,
          )} of net profit`}
          tone="tax"
        />
        <Stat
          label="Tax with giving"
          value={formatCurrency(scenarioB.totalTax)}
          detail={`${formatCurrency(taxSavings)} lower`}
          tone="keep"
        />
      </div>

      {netProfit <= 0 ? (
        <Alert>
          <TriangleAlert className="text-note-ink" />
          <AlertTitle>No taxable profit this year</AlertTitle>
          <AlertDescription>
            Expenses meet or exceed income, so there is nothing to tax and no khums
            obligation. Go back and adjust the figures to model a profitable year.
          </AlertDescription>
        </Alert>
      ) : null}

      {donationCarryforward > 0 ? (
        <Alert>
          <TriangleAlert className="text-note-ink" />
          <AlertTitle>Part of the gift carries forward</AlertTitle>
          <AlertDescription>
            Cash gifts to public charities are deductible up to{" "}
            {formatPercent(
              federalTax.charitable_deduction_limits.cash_public_charity_agi_limit,
              0,
            )}{" "}
            of income — {formatCurrency(agiLimitAmount)} here. Only that much is deducted
            this year; the remaining {formatCurrency(donationCarryforward)} carries
            forward for up to five years.
          </AlertDescription>
        </Alert>
      ) : null}

      {!stateAllowsCharitableDeduction && stateEntry.tax_type !== "none" ? (
        <Alert>
          <Info />
          <AlertTitle>{stateEntry.name} allows no charitable deduction</AlertTitle>
          <AlertDescription>
            The donation lowers your federal bill only — state tax is identical in both
            columns.
          </AlertDescription>
        </Alert>
      ) : null}

      <Comparison comparison={comparison} />

      <div className="grid gap-4 lg:grid-cols-2">
        <KhumsSummary
          khums={khums}
          donation={donationEntered}
          netProfit={netProfit}
        />
        <Allocation comparison={comparison} />
      </div>

      <Limitations stateNote={stateEntry.note} />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="h-10 px-3 text-[0.9rem]"
        >
          <ArrowLeft data-icon="inline-start" />
          Change my answers
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onRestart}
          className="h-10 px-4 text-[0.9rem]"
        >
          <RotateCcw data-icon="inline-start" />
          Start over
        </Button>
      </div>
    </div>
  );
}
