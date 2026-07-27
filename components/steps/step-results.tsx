"use client";

import {
  ArrowLeft,
  Landmark,
  MapPin,
  RotateCcw,
  TrendingDown,
  TriangleAlert,
} from "lucide-react";
import { BracketTable } from "@/components/results/bracket-table";
import { KhumsCoverage } from "@/components/results/khums-coverage";
import { Limitations } from "@/components/results/limitations";
import { TaxChart } from "@/components/results/tax-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { federalTax } from "@/lib/taxData";
import type { TaxComparison } from "@/lib/types";
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
    khums,
    scenarioB,
    taxSavings,
    stateEntry,
    donationEntered,
    donationCarryforward,
    agiLimitAmount,
    stateAllowsCharitableDeduction,
  } = comparison;

  const better = taxSavings > 0;

  return (
    <div className="animate-step-in space-y-4">
      <Verdict comparison={comparison} />

      <TaxChart comparison={comparison} />

      {khums.obligation > 0 ? (
        <KhumsCoverage khums={khums} donation={donationEntered} />
      ) : null}

      {donationCarryforward > 0 ? (
        <Alert>
          <TriangleAlert className="text-note-ink" />
          <AlertTitle>Part of the gift carries forward</AlertTitle>
          <AlertDescription>
            Cash gifts are deductible up to{" "}
            {formatPercent(
              federalTax.charitable_deduction_limits.cash_public_charity_agi_limit,
              0,
            )}{" "}
            of income — {formatCurrency(agiLimitAmount)} here. The remaining{" "}
            {formatCurrency(donationCarryforward)} carries forward up to five years.
          </AlertDescription>
        </Alert>
      ) : null}

      {donationEntered > 0 &&
      !stateAllowsCharitableDeduction &&
      stateEntry.tax_type !== "none" ? (
        <Alert>
          <TriangleAlert className="text-note-ink" />
          <AlertTitle>{stateEntry.name} allows no charitable deduction</AlertTitle>
          <AlertDescription>
            The donation lowers your federal bill only.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <BracketTable
          title="Federal brackets"
          icon={<Landmark />}
          result={better ? scenarioB.federal : comparison.scenarioA.federal}
        />
        {stateEntry.tax_type !== "none" ? (
          <BracketTable
            title={`${stateEntry.name} brackets`}
            icon={<MapPin />}
            result={better ? scenarioB.state : comparison.scenarioA.state}
          />
        ) : null}
        <Limitations stateNote={stateEntry.note} />
      </div>

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

/** Names the winner outright, so nobody has to compare two bars to find it. */
function Verdict({ comparison }: { comparison: TaxComparison }) {
  const { taxSavings, donationEntered, netCostOfGiving } = comparison;
  const better = taxSavings > 0;

  return (
    <Card
      className={cn(
        "rounded-2xl shadow-sm [--card-spacing:--spacing(6)]",
        better ? "bg-keep-soft ring-keep/25" : "ring-foreground/8",
      )}
    >
      <CardContent className="space-y-2">
        <p className="flex items-center gap-2 text-[0.8rem] font-semibold tracking-wider text-muted-foreground uppercase">
          {better ? <TrendingDown className="size-4 shrink-0 text-keep" /> : null}
          {better ? "Better option · with donation" : "Both options cost the same"}
        </p>

        {better ? (
          <>
            <p className="text-[0.95rem] font-medium text-foreground/70">You saved</p>
            <p className="max-w-full text-4xl leading-none font-semibold tracking-tight wrap-break-word text-keep-ink sm:text-5xl md:text-6xl">
              {formatCurrency(taxSavings)}
            </p>
            <p className="max-w-prose text-[0.95rem] leading-relaxed text-foreground/80">
              by donating {formatCurrency(donationEntered)} to a 501(c)(3). The gift
              really costs you {formatCurrency(Math.max(0, netCostOfGiving))}.
            </p>
          </>
        ) : (
          <>
            <p className="max-w-full text-4xl leading-none font-semibold tracking-tight wrap-break-word sm:text-5xl md:text-6xl">
              {formatCurrency(taxSavings)}
            </p>
            <p className="max-w-prose text-[0.95rem] leading-relaxed text-foreground/80">
              {donationEntered > 0
                ? "The gift does not lower this bill — taxable income is already at or below zero, or your state grants no charitable deduction."
                : "No donation entered, so there is nothing to compare yet."}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
