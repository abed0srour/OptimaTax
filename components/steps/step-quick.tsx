"use client";

import { Info } from "lucide-react";
import { ChoiceGroup } from "@/components/wizard/choice-group";
import { MoneyField } from "@/components/wizard/money-field";
import { Note } from "@/components/wizard/note";
import { StateSearch } from "@/components/wizard/state-search";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { formatCurrency, formatPercent, parseMoney } from "@/lib/format";
import { calculateCharitableLimit } from "@/lib/tax";
import { filingStatuses } from "@/lib/taxData";
import type { CharityType, FilingStatus, PropertyType } from "@/lib/types";

/** The whole quick estimate on one screen, then straight to results. */
export function StepQuick({
  agiText,
  itemizedText,
  donationText,
  charityType,
  propertyType,
  filingStatus,
  stateCode,
  onAgiChange,
  onItemizedChange,
  onDonationChange,
  onCharityTypeChange,
  onPropertyTypeChange,
  onFilingStatusChange,
  onStateChange,
  onNext,
}: {
  agiText: string;
  itemizedText: string;
  donationText: string;
  charityType: CharityType;
  propertyType: PropertyType;
  filingStatus: FilingStatus;
  stateCode: string;
  onAgiChange: (value: string) => void;
  onItemizedChange: (value: string) => void;
  onDonationChange: (value: string) => void;
  onCharityTypeChange: (value: CharityType) => void;
  onPropertyTypeChange: (value: PropertyType) => void;
  onFilingStatusChange: (status: FilingStatus) => void;
  onStateChange: (code: string) => void;
  onNext: () => void;
}) {
  const agi = parseMoney(agiText);
  const donation = parseMoney(donationText);
  const limit = calculateCharitableLimit(donation, agi, charityType, propertyType);

  return (
    <StepCard
      title="Quick estimate"
      subtitle="Use last year's figures, or your best guess for this year."
      footer={<StepNav onNext={onNext} nextLabel="See results" />}
    >
      <MoneyField
        label="Adjusted gross income (AGI)"
        value={agiText}
        onChange={onAgiChange}
        placeholder="85,000"
      />

      <MoneyField
        label="Other itemized deductions"
        value={itemizedText}
        onChange={onItemizedChange}
        placeholder="0"
        size="md"
      />

      <ChoiceGroup
        label="Filing status"
        value={filingStatus}
        onChange={(value) => onFilingStatusChange(value as FilingStatus)}
        choices={filingStatuses.map((status) => ({
          value: status.id,
          label: status.label,
        }))}
      />

      <StateSearch
        label="State you live in"
        value={stateCode}
        onChange={onStateChange}
      />

      <MoneyField
        label="Charitable gift / khums amount"
        value={donationText}
        onChange={onDonationChange}
        tone="give"
      />

      <ChoiceGroup<CharityType>
        label="Who receives the gift"
        value={charityType}
        onChange={onCharityTypeChange}
        columns={1}
        choices={[
          {
            value: "public",
            label: "Public charity, church or mosque",
            detail: "Most 501(c)(3) organizations",
          },
          {
            value: "private",
            label: "Private foundation",
            detail: "Lower ceilings apply",
          },
        ]}
      />

      <ChoiceGroup<PropertyType>
        label="What you're giving"
        value={propertyType}
        onChange={onPropertyTypeChange}
        choices={[
          { value: "cash", label: "Cash" },
          {
            value: "appreciated_property",
            label: "Appreciated property",
            detail: "Held over a year",
          },
        ]}
      />

      <div
        role="note"
        className="flex gap-3 rounded-2xl border border-note/30 bg-note-soft px-4 py-3 text-sm leading-relaxed text-note-ink"
      >
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        <p>
          In general, US churches and mosques are public charities, but verify
          the foundation&apos;s official IRS classification. Your deduction is
          capped based on your selection.
        </p>
      </div>

      <LimitFeedback
        agi={agi}
        donation={donation}
        limit={limit}
      />

      <Note>
        Taxed as ordinary income, with no payroll tax or dependents. Only the
        part of your gift above 0.5% of income is deductible, and only if
        itemizing beats the standard deduction.
      </Note>
    </StepCard>
  );
}

/** Live read on the AGI ceiling for the current selection. */
function LimitFeedback({
  agi,
  donation,
  limit,
}: {
  agi: number;
  donation: number;
  limit: ReturnType<typeof calculateCharitableLimit>;
}) {
  const over = limit.carryforward > 0;

  return (
    <div
      aria-live="polite"
      className="rounded-2xl border border-border px-4 py-3 text-sm leading-relaxed"
    >
      <p className="text-muted-foreground">
        Deduction ceiling ({formatPercent(limit.rate, 0)} of AGI)
      </p>
      <p className="tnum font-display text-2xl tracking-tight">
        {agi > 0 ? formatCurrency(limit.ceiling) : "Enter your AGI"}
      </p>

      {agi > 0 && donation > 0 ? (
        <p className={over ? "mt-1 text-tax-ink" : "mt-1 text-keep-ink"}>
          {over
            ? `Your gift is ${formatCurrency(limit.carryforward)} over the limit. That part carries forward up to five years.`
            : "Your gift is within the limit."}
        </p>
      ) : null}
    </div>
  );
}
