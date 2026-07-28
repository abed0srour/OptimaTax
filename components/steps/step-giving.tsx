"use client";

import { HandCoins, HandHeart, Moon, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  detail: string;
}[] = [
  {
    value: "stacked",
    label: "Standard deduction + gift",
    detail: "Subtracts both. Simpler, and what this project specifies.",
  },
  {
    value: "itemized",
    label: "The greater of the two",
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

  return (
    <StepCard
      icon={<HandHeart />}
      eyebrow="Step 4 of 5"
      title="How much will you give?"
      footer={
        <StepNav onBack={onBack} onNext={onNext} nextLabel="See my results" />
      }
    >
      {/* 1 · The amount, and the two shortcuts for choosing one. */}
      <div className="space-y-2.5">
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
            "flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 transition-colors",
            checked && "border-give/30 bg-give-soft/70",
            isIndicatorOnly ? "cursor-default" : "cursor-pointer hover:bg-muted/70",
          )}
        >
          <Checkbox
            checked={checked}
            disabled={isIndicatorOnly}
            onCheckedChange={(value) => onMatchKhumsChange(value === true)}
          />
          <Moon
            className={cn(
              "size-4 shrink-0",
              checked ? "text-give" : "text-muted-foreground",
            )}
          />
          <span
            className={cn(
              "min-w-0 flex-1 text-[0.9rem] font-medium",
              checked ? "text-give-ink" : "text-foreground/80",
            )}
          >
            {covered ? "Khums covered" : "Match my khums"}
          </span>
          <span
            className={cn(
              "tnum shrink-0 text-[0.9rem] font-semibold whitespace-nowrap",
              checked ? "text-give-ink" : "text-muted-foreground",
            )}
          >
            {formatCurrency(khums.obligation)}
          </span>
        </label>

        {!matchKhums && bracketTarget ? (
          <BracketSuggestion
            target={bracketTarget}
            hasAmount={donationAmount > 0}
            onApply={() =>
              onDonationChange(toMoneyInput(bracketTarget.targetDonation))
            }
          />
        ) : null}
      </div>

      {/*
       * 2 · The payoff. Previously the page asked for a number and told you
       * nothing until the next screen; the whole point of the amount is what
       * it does to the bill, so it belongs beside the field that sets it.
       */}
      {donationAmount > 0 ? (
        <Impact taxSavings={taxSavings} netCostOfGiving={netCostOfGiving} />
      ) : null}

      {/* 3 · The one setting that changes all of the above. */}
      <ChoiceGroup
        label="How the deduction works"
        value={deductionMode}
        onChange={(value) => onDeductionModeChange(value as DeductionMode)}
        choices={DEDUCTION_MODES}
        columns={2}
      />
    </StepCard>
  );
}

/**
 * The gift's effect, in the two numbers people actually weigh: what it saves,
 * and what it therefore costs.
 */
function Impact({
  taxSavings,
  netCostOfGiving,
}: {
  taxSavings: number;
  netCostOfGiving: number;
}) {
  const saved = taxSavings > 0;

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3.5",
        saved ? "border-keep/30 bg-keep-soft" : "border-border bg-muted/40",
      )}
    >
      <p
        className={cn(
          "text-[0.7rem] font-semibold tracking-wider uppercase",
          saved ? "text-keep-ink/70" : "text-muted-foreground",
        )}
      >
        What this gift does
      </p>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span
          className={cn(
            "min-w-0 text-[0.9rem]",
            saved ? "text-keep-ink/80" : "text-foreground/70",
          )}
        >
          Tax saved
        </span>
        <span
          className={cn(
            "shrink-0 text-2xl leading-none font-semibold tracking-tight whitespace-nowrap",
            saved ? "text-keep-ink" : "text-muted-foreground",
          )}
        >
          {formatCurrency(Math.max(0, taxSavings))}
        </span>
      </div>

      <div
        className={cn(
          "mt-2.5 flex items-baseline justify-between gap-3 border-t pt-2.5",
          saved ? "border-keep/20" : "border-border",
        )}
      >
        <span
          className={cn(
            "min-w-0 text-[0.9rem]",
            saved ? "text-keep-ink/80" : "text-foreground/70",
          )}
        >
          The gift really costs you
        </span>
        <span className="tnum shrink-0 text-[0.95rem] font-semibold whitespace-nowrap">
          {formatCurrency(Math.max(0, netCostOfGiving))}
        </span>
      </div>
    </div>
  );
}

/**
 * The amount that lands taxable income on a bracket floor.
 *
 * Leads with the total to give rather than the increment: the button sets an
 * absolute amount, and showing "give $28,200 more" beside a "Use $78,200"
 * button left the reader with two numbers and no idea which one the button
 * meant. The increment is now context, in the same sentence.
 */
function BracketSuggestion({
  target,
  hasAmount,
  onApply,
}: {
  target: NonNullable<TaxComparison["bracketTarget"]>;
  hasAmount: boolean;
  onApply: () => void;
}) {
  return (
    /* Stacks on phones so the sentence never gets squeezed against the button. */
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 sm:flex-row sm:items-center sm:gap-3">
      <span className="flex min-w-0 flex-1 items-start gap-3">
        <TrendingDown className="mt-0.5 size-4 shrink-0 text-keep" />
        <span className="min-w-0 text-[0.85rem] leading-snug text-foreground/80">
          Give {formatCurrency(target.targetDonation)}
          {hasAmount ? (
            <> — {formatCurrency(target.additionalDonationNeeded)} more —</>
          ) : null}{" "}
          to drop your top federal rate from{" "}
          <span className="font-semibold">{formatRate(target.currentRate)}</span>{" "}
          to <span className="font-semibold">{formatRate(target.targetRate)}</span>
          .
        </span>
      </span>

      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={onApply}
        className="ml-7 self-start sm:ml-0 sm:shrink-0 sm:self-auto"
      >
        Use it
      </Button>
    </div>
  );
}
