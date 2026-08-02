"use client";

import { HandHeart, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Readout } from "@/components/wizard/readout";
import { StepCard } from "@/components/wizard/step-card";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { ScenarioBreakdown, StateTaxEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The bill as it stands, before any giving — and the offer to see what a
 * 501(c)(3) donation would do to it. Giving is presented as one of two
 * outcomes, never as the required next step.
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
      icon={<Landmark />}
      eyebrow="Step 3 of 5"
      title="This is what you owe"
      footer={
        <CardFooter className="bg-muted/40 px-4 py-3 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="h-10 w-full px-3 text-[0.9rem] sm:w-auto"
          >
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>
        </CardFooter>
      }
    >
      <Readout
        label="Total tax due"
        value={formatCurrency(scenario.totalTax)}
        tone="tax"
      />

      {/*
       * Only the lines that carry a figure. A W-2 filer never sees a $0
       * self-employment row, and a freelancer never sees a $0 FICA row.
       */}
      <dl className="space-y-3">
        <Line label="Federal income tax" value={scenario.federalIncomeTax} />

        {scenario.credits.applied > 0 ? (
          <Line
            label="Dependent credits"
            value={-scenario.credits.applied}
            tone="credit"
          />
        ) : null}

        {scenario.selfEmployment.total > 0 ? (
          <Line
            label="Self-employment tax"
            value={scenario.selfEmployment.total}
          />
        ) : null}

        {scenario.ficaWithheld > 0 ? (
          <Line label="FICA withheld" value={scenario.ficaWithheld} />
        ) : null}

        {scenario.additionalMedicare > 0 ? (
          <Line
            label="Additional Medicare tax"
            value={scenario.additionalMedicare}
          />
        ) : null}

        {scenario.netInvestmentIncomeTax > 0 ? (
          <Line
            label="Net investment income tax"
            value={scenario.netInvestmentIncomeTax}
          />
        ) : null}

        <Line
          label={`${stateEntry.name} income tax`}
          value={scenario.state.tax}
          muted={stateEntry.tax_type === "none"}
        />

        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
          <dt className="min-w-0 text-[0.9rem] font-semibold">
            Net income after tax
          </dt>
          <dd className="tnum shrink-0 text-lg font-semibold whitespace-nowrap">
            {formatCurrency(scenario.afterTaxIncome)}
          </dd>
        </div>
      </dl>

      {/*
       * Two explicit outcomes separated by "or". Giving is a choice, not the
       * next required step, and a lone primary button reads as though the tax
       * bill obliges you to donate.
       */}
      <div className="space-y-2 pt-1">
        <p className="text-center text-[0.85rem] leading-relaxed text-foreground/70">
          pay less taxes by donating to a 501(c)(3) nonprofit organization 
        </p>

        <Button
          type="button"
          onClick={onDonate}
          className="h-11 w-full text-[0.9rem]"
        >
          <HandHeart data-icon="inline-start" />
          Give to a 501(c)(3)
        </Button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onSkip}
          className="h-11 w-full text-[0.9rem]"
        >
          I&apos;m not donating — see my results
        </Button>
      </div>
    </StepCard>
  );
}

function Line({
  label,
  value,
  muted = false,
  tone = "default",
}: {
  label: string;
  value: number;
  muted?: boolean;
  /** `credit` renders a reduction — shown as a negative, in the keep colour. */
  tone?: "default" | "credit";
}) {
  const isCredit = tone === "credit";

  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="min-w-0 text-[0.9rem] text-foreground/80">{label}</dt>
      <dd
        className={cn(
          "tnum shrink-0 font-medium whitespace-nowrap",
          muted && "text-muted-foreground",
          isCredit && "text-keep-ink",
        )}
      >
        {muted
          ? "None"
          : isCredit
            ? `−${formatCurrency(Math.abs(value))}`
            : formatCurrency(value)}
      </dd>
    </div>
  );
}
