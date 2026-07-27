"use client";

import { HandCoins, HandHeart, Scale } from "lucide-react";
import { Disclosure } from "@/components/ui-extras/disclosure";
import { ChoiceGroup } from "@/components/wizard/choice-group";
import { MoneyField } from "@/components/wizard/money-field";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import type { DeductionMode } from "@/lib/types";

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
  onDonationChange,
  onDeductionModeChange,
  onBack,
  onNext,
}: {
  donationText: string;
  deductionMode: DeductionMode;
  onDonationChange: (value: string) => void;
  onDeductionModeChange: (mode: DeductionMode) => void;
  onBack: () => void;
  onNext: () => void;
}) {
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
      />

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
