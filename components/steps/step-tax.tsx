"use client";

import { Button } from "@/components/ui/button";
import { Readout } from "@/components/wizard/readout";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { formatCurrency } from "@/lib/format";
import type { ScenarioBreakdown, StateTaxEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The bill as it stands, before any giving — and the offer to see what a
 * 501(c)(3) donation would do to it. Giving is presented as one of two
 * equal outcomes, never as the required next step.
 */
export function StepTax({
  scenario,
  stateEntry,
  onBack,
  onDonate,
  onSkip,
}: {
  scenario: ScenarioBreakdown;
  stateEntry: StateTaxEntry;
  onBack: () => void;
  onDonate: () => void;
  onSkip: () => void;
}) {
  return (
    <StepCard
      title="Here's what you owe"
      footer={<StepNav onBack={onBack} sticky={false} />}
    >
      <Readout
        label="Total tax this year"
        value={formatCurrency(scenario.totalTax)}
        tone="tax"
      />

      {/*
       * Only the lines that carry a figure. A W-2 filer never sees a $0
       * self-employment row, and a freelancer never sees a $0 FICA row.
       */}
      <dl className="divide-y divide-border">
        <Line label="Federal income tax" value={scenario.federalIncomeTax} />

        {scenario.credits.applied > 0 ? (
          <Line label="Dependent credits" value={-scenario.credits.applied} credit />
        ) : null}

        {scenario.selfEmployment.total > 0 ? (
          <Line label="Self-employment tax" value={scenario.selfEmployment.total} />
        ) : null}

        {scenario.ficaWithheld > 0 ? (
          <Line label="FICA (Social Security & Medicare)" value={scenario.ficaWithheld} />
        ) : null}

        {scenario.additionalMedicare > 0 ? (
          <Line label="Additional Medicare tax" value={scenario.additionalMedicare} />
        ) : null}

        {scenario.netInvestmentIncomeTax > 0 ? (
          <Line label="Net investment income tax" value={scenario.netInvestmentIncomeTax} />
        ) : null}

        <Line
          label={`${stateEntry.name} tax`}
          value={scenario.state.tax}
          muted={stateEntry.tax_type === "none"}
        />

        <div className="flex items-baseline justify-between gap-3 py-3">
          <dt className="min-w-0 text-[0.95rem] font-semibold">You keep</dt>
          <dd className="tnum shrink-0 text-lg font-semibold whitespace-nowrap">
            {formatCurrency(scenario.afterTaxIncome)}
          </dd>
        </div>
      </dl>

      <div className="space-y-3 rounded-2xl bg-muted p-4 sm:p-5">
        <p className="text-[0.95rem] leading-relaxed">
          A gift to a 501(c)(3) charity can lower this bill.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            onClick={onDonate}
            className="h-12 rounded-full text-[0.95rem] sm:h-11"
          >
            See what giving saves
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            className="h-12 rounded-full bg-card text-[0.95rem] sm:h-11"
          >
            Skip to results
          </Button>
        </div>
      </div>
    </StepCard>
  );
}

function Line({
  label,
  value,
  muted = false,
  credit = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
  /** Renders a reduction — shown as a negative, in the keep colour. */
  credit?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-3">
      <dt className="min-w-0 text-[0.95rem] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "tnum shrink-0 font-medium whitespace-nowrap",
          muted && "text-muted-foreground",
          credit && "text-keep-ink",
        )}
      >
        {muted
          ? "None"
          : credit
            ? `−${formatCurrency(Math.abs(value))}`
            : formatCurrency(value)}
      </dd>
    </div>
  );
}
