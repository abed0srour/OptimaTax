"use client";

import { HandCoins, HandHeart, Moon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ChoiceGroup } from "@/components/wizard/choice-group";
import { MoneyField } from "@/components/wizard/money-field";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { formatCurrency, parseMoney } from "@/lib/format";
import type { DeductionMode } from "@/lib/types";
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
  khumsObligation,
  matchKhums,
  onDonationChange,
  onDeductionModeChange,
  onMatchKhumsChange,
  onBack,
  onNext,
}: {
  donationText: string;
  deductionMode: DeductionMode;
  khumsObligation: number;
  matchKhums: boolean;
  onDonationChange: (value: string) => void;
  onDeductionModeChange: (mode: DeductionMode) => void;
  onMatchKhumsChange: (checked: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const donationAmount = parseMoney(donationText);
  const covered = khumsObligation > 0 && donationAmount >= khumsObligation;
  const checked = matchKhums || covered;
  const isIndicatorOnly = covered && !matchKhums;

  return (
    <StepCard
      icon={<HandHeart />}
      eyebrow="Step 4 of 5"
      title="How much will you give?"
      footer={
        <StepNav onBack={onBack} onNext={onNext} nextLabel="See my results" />
      }
    >
      <MoneyField
        label="Donation to a 501(c)(3)"
        icon={<HandCoins />}
        value={donationText}
        onChange={onDonationChange}
        tone="give"
        disabled={matchKhums}
      />

      <label
        className={cn(
          "flex items-start gap-3 rounded-xl border border-give/25 bg-give-soft/60 px-4 py-3",
          isIndicatorOnly && "cursor-default",
        )}
      >
        <Checkbox
          checked={checked}
          disabled={isIndicatorOnly}
          onCheckedChange={(value) => onMatchKhumsChange(value === true)}
          className="mt-0.5"
        />
        <span className="space-y-0.5">
          <span className="flex items-center gap-2 text-[0.9rem] font-medium text-give-ink">
            <Moon className="size-4 shrink-0" />
            {checked
              ? "Your khums payment is covered"
              : "Automatically match my khums"}
          </span>
          <p className="text-[0.8rem] leading-relaxed text-give-ink/80">
            {checked
              ? `Your donation covers your ${formatCurrency(
                  khumsObligation,
                )} khums obligation in full.`
              : `Sets your donation to ${formatCurrency(
                  khumsObligation,
                )} — one fifth of this year's net profit.`}
          </p>
        </span>
      </label>

      <ChoiceGroup
        label="Deduction model"
        value={deductionMode}
        onChange={(value) => onDeductionModeChange(value as DeductionMode)}
        choices={DEDUCTION_MODES}
        columns={2}
      />
    </StepCard>
  );
}
