"use client";

import { ChoiceGroup } from "@/components/wizard/choice-group";
import { MoneyField } from "@/components/wizard/money-field";
import { Note } from "@/components/wizard/note";
import { StateSearch } from "@/components/wizard/state-search";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { filingStatuses } from "@/lib/taxData";
import type { FilingStatus } from "@/lib/types";

/** The whole quick estimate on one screen: four answers, then straight to results. */
export function StepQuick({
  agiText,
  filingStatus,
  stateCode,
  donationText,
  onAgiChange,
  onFilingStatusChange,
  onStateChange,
  onDonationChange,
  onNext,
}: {
  agiText: string;
  filingStatus: FilingStatus;
  stateCode: string;
  donationText: string;
  onAgiChange: (value: string) => void;
  onFilingStatusChange: (status: FilingStatus) => void;
  onStateChange: (code: string) => void;
  onDonationChange: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <StepCard
      title="Quick estimate"
      subtitle="Four answers, and you'll see what giving saves."
      footer={<StepNav onNext={onNext} nextLabel="See results" />}
    >
      <MoneyField
        label="Estimated annual income (AGI)"
        value={agiText}
        onChange={onAgiChange}
        placeholder="85,000"
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

      <Note>
        Taxed as ordinary income, with no payroll tax or dependents. Only the
        part of your gift above 0.5% of income is deductible, and only if
        itemizing beats the standard deduction.
      </Note>
    </StepCard>
  );
}
