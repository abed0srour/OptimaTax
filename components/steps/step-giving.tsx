"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Disclosure } from "@/components/ui-extras/disclosure";
import { ChoiceGroup } from "@/components/wizard/choice-group";
import { MoneyField } from "@/components/wizard/money-field";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { formatCurrency, formatRate, parseMoney, toMoneyInput } from "@/lib/format";
import type { DeductionMode, TaxComparison } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Named for what each model does to your money, not for where the rule comes
 * from — "Stacked (project brief)" told the reader nothing they could act on.
 */
export const DEDUCTION_MODES: {
  value: DeductionMode;
  label: string;
  short: string;
  detail: string;
}[] = [
  {
    value: "stacked",
    label: "Standard deduction + gift",
    short: "Standard + gift",
    detail: "Subtracts both. Simpler, and what this project specifies.",
  },
  {
    value: "itemized",
    label: "The greater of the two",
    short: "Greater of two",
    detail: "The real IRS rule. A gift under your standard deduction adds nothing.",
  },
];

export function StepGiving({
  donationText,
  deductionMode,
  matchKhums,
  comparison,
  onDonationChange,
  onDeductionModeChange,
  onMatchKhumsChange,
  onBack,
  onNext,
}: {
  donationText: string;
  deductionMode: DeductionMode;
  matchKhums: boolean;
  comparison: TaxComparison;
  onDonationChange: (value: string) => void;
  onDeductionModeChange: (mode: DeductionMode) => void;
  onMatchKhumsChange: (checked: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { khums, bracketTarget, taxSavings, netCostOfGiving } = comparison;

  const donationAmount = parseMoney(donationText);
  const covered = khums.obligation > 0 && donationAmount >= khums.obligation;
  const checked = matchKhums || covered;
  const isIndicatorOnly = covered && !matchKhums;
  const mode = DEDUCTION_MODES.find((entry) => entry.value === deductionMode);

  return (
    <StepCard
      title="How much will you give?"
      subtitle="To a 501(c)(3) charity, this year."
      footer={
        <StepNav onBack={onBack} onNext={onNext} nextLabel="See my results" />
      }
    >
      <div className="space-y-3">
        <MoneyField
          label="Donation"
          value={donationText}
          onChange={onDonationChange}
          tone="give"
          disabled={matchKhums}
        />

        <label
          className={cn(
            "flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
            checked ? "border-give/40 bg-give-soft" : "border-border",
            isIndicatorOnly ? "cursor-default" : "cursor-pointer hover:border-foreground/30",
          )}
        >
          <Checkbox
            checked={checked}
            disabled={isIndicatorOnly}
            onCheckedChange={(value) => onMatchKhumsChange(value === true)}
          />
          <span
            className={cn(
              "min-w-0 flex-1 text-[0.95rem] font-medium",
              checked && "text-give-ink",
            )}
          >
            {covered ? "Khums covered" : "Match my khums"}
          </span>
          <span
            className={cn(
              "tnum shrink-0 text-[0.95rem] font-semibold whitespace-nowrap",
              checked ? "text-give-ink" : "text-muted-foreground",
            )}
          >
            {formatCurrency(khums.obligation)}
          </span>
        </label>

        {!matchKhums && bracketTarget ? (
          <BracketSuggestion
            target={bracketTarget}
            onApply={() =>
              onDonationChange(toMoneyInput(bracketTarget.targetDonation))
            }
          />
        ) : null}
      </div>

      {/* The payoff sits beside the field that sets it. */}
      {donationAmount > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          <Figure
            label="Tax saved"
            value={formatCurrency(Math.max(0, taxSavings))}
            highlight={taxSavings > 0}
          />
          <Figure
            label="Real cost to you"
            value={formatCurrency(Math.max(0, netCostOfGiving))}
          />
        </div>
      ) : null}

      <Disclosure
        title="Deduction method"
        aside={<span className="hidden min-[400px]:inline">{mode?.short}</span>}
      >
        <ChoiceGroup
          label="How the gift is deducted"
          value={deductionMode}
          onChange={(value) => onDeductionModeChange(value as DeductionMode)}
          choices={DEDUCTION_MODES}
          columns={1}
        />
      </Disclosure>
    </StepCard>
  );
}

function Figure({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl px-4 py-3.5",
        highlight ? "bg-keep-soft" : "bg-muted",
      )}
    >
      <p className="text-[0.8rem] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "tnum font-display mt-1 text-[1.9rem] leading-none tracking-tight wrap-break-word sm:text-4xl",
          highlight && "text-keep-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** The total gift that lands taxable income on a lower bracket's floor. */
function BracketSuggestion({
  target,
  onApply,
}: {
  target: NonNullable<TaxComparison["bracketTarget"]>;
  onApply: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-muted px-4 py-3 sm:flex-row sm:items-center">
      <p className="min-w-0 flex-1 text-sm leading-snug text-muted-foreground">
        Give{" "}
        <span className="tnum font-semibold text-foreground">
          {formatCurrency(target.targetDonation)}
        </span>{" "}
        to drop your top federal rate from {formatRate(target.currentRate)} to{" "}
        {formatRate(target.targetRate)}.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onApply}
        className="h-9 self-start rounded-full bg-card px-4 sm:self-auto"
      >
        Use this amount
      </Button>
    </div>
  );
}
