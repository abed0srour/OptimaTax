"use client";

import {
  Check,
  HandCoins,
  HandHeart,
  Moon,
  Scale,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Disclosure } from "@/components/ui-extras/disclosure";
import { ChoiceGroup } from "@/components/wizard/choice-group";
import { MoneyField } from "@/components/wizard/money-field";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { formatCurrency, toMoneyInput } from "@/lib/format";
import type { DeductionMode, KhumsBreakdown } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  onDonationChange,
  onDeductionModeChange,
  onBack,
  onNext,
}: {
  donationText: string;
  deductionMode: DeductionMode;
  khums: KhumsBreakdown;
  onDonationChange: (value: string) => void;
  onDeductionModeChange: (mode: DeductionMode) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const coverage = Math.round(khums.coverage * 100);
  const covered = khums.remaining <= 0 && khums.obligation > 0;

  return (
    <StepCard
      icon={<HandHeart />}
      eyebrow="Step 4 of 5"
      title="How much will you give?"
      footer={
        <StepNav onBack={onBack} onNext={onNext} nextLabel="See my results" />
      }
    >
      <div className="space-y-2">
        <MoneyField
          label="Donation to a 501(c)(3)"
          icon={<HandCoins />}
          value={donationText}
          onChange={onDonationChange}
          tone="give"
        />

        {/* The target sits under the field it fills, small enough to read as a hint. */}
        {khums.obligation > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-give-soft px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs text-give-ink">
              <Moon className="size-3.5 shrink-0" />
              Your khums this year
              <span className="tnum font-semibold">
                {formatCurrency(khums.obligation)}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onDonationChange(toMoneyInput(khums.obligation))}
              className="font-semibold text-give-ink hover:bg-give/10"
            >
              Give exactly this
            </Button>
          </div>
        ) : null}
      </div>

      {khums.obligation > 0 ? (
        <div
          className={cn(
            "space-y-3 rounded-xl border px-4 py-3.5",
            covered ? "border-keep/30 bg-keep-soft" : "border-note/35 bg-note-soft",
          )}
        >
          <div className="flex items-start gap-2.5">
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                covered ? "bg-keep text-white" : "bg-note text-white",
              )}
            >
              {covered ? (
                <Check className="size-3" strokeWidth={3.5} />
              ) : (
                <TriangleAlert className="size-3" strokeWidth={2.5} />
              )}
            </span>
            <p
              className={cn(
                "text-[0.85rem] leading-relaxed font-medium",
                covered ? "text-keep-ink" : "text-note-ink",
              )}
            >
              {verdict(khums)}
            </p>
          </div>

          <Progress
            value={coverage}
            aria-label="Share of the khums obligation covered"
            className={cn(
              "h-2",
              covered
                ? "**:data-[slot=progress-indicator]:bg-keep"
                : "**:data-[slot=progress-indicator]:bg-note",
            )}
          />

          {!covered && khums.remaining > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onDonationChange(toMoneyInput(khums.obligation))}
              className="h-8 bg-card text-xs font-semibold"
            >
              Top up to {formatCurrency(khums.obligation)}
            </Button>
          ) : null}
        </div>
      ) : null}

      <Disclosure
        icon={<Scale />}
        title="Deduction model"
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

function verdict(khums: KhumsBreakdown): string {
  if (khums.fulfilled <= 0) {
    return `Nothing given yet — ${formatCurrency(khums.obligation)} of khums is still due.`;
  }
  if (khums.remaining > 0) {
    return `This covers ${formatCurrency(khums.fulfilled)} of your khums. ${formatCurrency(
      khums.remaining,
    )} is still outstanding.`;
  }
  if (khums.surplus > 0) {
    return `Your khums is fully covered, with ${formatCurrency(
      khums.surplus,
    )} given beyond it as sadaqah.`;
  }
  return "This covers your khums exactly.";
}
