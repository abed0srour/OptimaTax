"use client";

import { HandCoins, HandHeart, Moon, Scale } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Disclosure } from "@/components/ui-extras/disclosure";
import { ChoiceGroup } from "@/components/wizard/choice-group";
import { MoneyField } from "@/components/wizard/money-field";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { formatCurrency } from "@/lib/format";
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

      <label className="flex items-start gap-3 rounded-xl border border-give/25 bg-give-soft/60 px-4 py-3">
        <Checkbox
          checked={matchKhums}
          onCheckedChange={(checked) => onMatchKhumsChange(checked === true)}
          className="mt-0.5"
        />
        <span className="space-y-0.5">
          <span className="flex items-center gap-2 text-[0.9rem] font-medium text-give-ink">
            <Moon className="size-4 shrink-0" />
            Automatically match my khums
          </span>
          <p className="text-[0.8rem] leading-relaxed text-give-ink/80">
            Sets your donation to {formatCurrency(khumsObligation)} — one fifth
            of this year&apos;s net profit.
          </p>
        </span>
      </label>

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
