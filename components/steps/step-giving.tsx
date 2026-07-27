"use client";

import { HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Disclosure } from "@/components/ui-extras/disclosure";
import { ChoiceGroup } from "@/components/wizard/choice-group";
import { MoneyField } from "@/components/wizard/money-field";
import { Readout } from "@/components/wizard/readout";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { formatCurrency, formatPercent, toMoneyInput } from "@/lib/format";
import { KHUMS_RATE } from "@/lib/tax";
import type { DeductionMode, KhumsBreakdown } from "@/lib/types";

export const DEDUCTION_MODES: {
  value: DeductionMode;
  label: string;
  detail: string;
}[] = [
  {
    value: "stacked",
    label: "Stacked (project brief)",
    detail:
      "Standard deduction plus the full donation. Generous, and the simplest to reason about.",
  },
  {
    value: "itemized",
    label: "IRS itemization (actual rule)",
    detail:
      "You take the greater of the standard deduction or your itemized total, not both. A gift smaller than the standard deduction yields no extra federal benefit.",
  },
];

export function StepGiving({
  donationText,
  deductionMode,
  khums,
  netProfit,
  onDonationChange,
  onDeductionModeChange,
  onBack,
  onNext,
}: {
  donationText: string;
  deductionMode: DeductionMode;
  khums: KhumsBreakdown;
  netProfit: number;
  onDonationChange: (value: string) => void;
  onDeductionModeChange: (mode: DeductionMode) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const coverage = Math.round(khums.coverage * 100);

  return (
    <StepCard
      icon={<HandHeart />}
      eyebrow="Step 3 of 4"
      title="How much are you giving?"
      description="Khums is one fifth of the year's surplus. Route it through a 501(c)(3) and the same money also becomes a charitable deduction."
      footer={
        <StepNav onBack={onBack} onNext={onNext} nextLabel="See my results" />
      }
    >
      <Readout
        label={`Khums due this year (${formatPercent(KHUMS_RATE, 0)} of net profit)`}
        value={formatCurrency(khums.obligation)}
        hint={
          netProfit > 0
            ? "One fifth of the surplus left after the year's expenses."
            : "No surplus this year, so no khums is calculated."
        }
        tone="give"
        action={
          khums.obligation > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onDonationChange(toMoneyInput(khums.obligation))}
              className="h-8 shrink-0 text-xs font-semibold"
            >
              Use this
            </Button>
          ) : undefined
        }
      />

      <MoneyField
        label="Charitable donation to a 501(c)(3)"
        value={donationText}
        onChange={onDonationChange}
        placeholder="0"
        tone="give"
        hint="All or part of this can count toward your khums. Leave it at 0 to see the untouched tax bill."
        action={
          khums.obligation > 0
            ? {
                label: "Match my khums",
                title: `Set the donation to ${formatCurrency(khums.obligation)}`,
                onClick: () => onDonationChange(toMoneyInput(khums.obligation)),
              }
            : undefined
        }
      />

      {khums.obligation > 0 ? (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">Khums covered</span>
            <span className="tnum text-muted-foreground">
              {formatCurrency(khums.fulfilled)} of {formatCurrency(khums.obligation)}
              <span className="ml-2 font-semibold text-give-ink">{coverage}%</span>
            </span>
          </div>
          <Progress
            value={coverage}
            className="h-2 **:data-[slot=progress-indicator]:bg-give"
          />
          {khums.surplus > 0 ? (
            <p className="text-xs text-muted-foreground">
              {formatCurrency(khums.surplus)} beyond the obligation counts as voluntary
              sadaqah — still deductible, subject to the federal AGI ceiling.
            </p>
          ) : null}
        </div>
      ) : null}

      <Disclosure
        title="How the deduction stacks"
        aside={deductionMode === "stacked" ? "Stacked" : "Itemized"}
      >
        <ChoiceGroup
          label="Deduction model"
          value={deductionMode}
          onChange={(value) => onDeductionModeChange(value as DeductionMode)}
          choices={DEDUCTION_MODES}
          columns={1}
        />
      </Disclosure>
    </StepCard>
  );
}
