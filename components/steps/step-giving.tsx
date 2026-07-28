"use client";

import { HandCoins, HandHeart, Moon, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChoiceGroup } from "@/components/wizard/choice-group";
import { MoneyField } from "@/components/wizard/money-field";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { formatCurrency, formatRate, parseMoney, toMoneyInput } from "@/lib/format";
import type { BracketTarget, DeductionMode } from "@/lib/types";
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
  bracketTarget,
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
  bracketTarget: BracketTarget | null;
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

      {!matchKhums && bracketTarget ? (
        <div className="flex items-start gap-3 rounded-xl border border-keep/25 bg-keep-soft/60 px-4 py-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-keep/15 text-keep-ink">
            <TrendingDown className="size-4" />
          </span>
          <span className="min-w-0 flex-1 space-y-1.5">
            <span className="block text-[0.9rem] font-medium text-keep-ink">
              Drop from {formatRate(bracketTarget.currentRate)} into{" "}
              {formatRate(bracketTarget.targetRate)}
            </span>
            <span className="block text-[0.8rem] leading-relaxed text-keep-ink/80">
              Give {formatCurrency(bracketTarget.additionalDonationNeeded)} more
              (federal bracket only) to fall out of the{" "}
              {formatRate(bracketTarget.currentRate)} bracket entirely.
            </span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() =>
                onDonationChange(toMoneyInput(bracketTarget.targetDonation))
              }
              className="border-keep/40 text-keep-ink hover:bg-keep/10"
            >
              Use {formatCurrency(bracketTarget.targetDonation)}
            </Button>
          </span>
        </div>
      ) : null}

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
