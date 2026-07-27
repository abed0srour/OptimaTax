"use client";

import { House, MapPin, User, UserMinus, Users } from "lucide-react";
import { ChoiceGroup } from "@/components/wizard/choice-group";
import { StateSearch } from "@/components/wizard/state-search";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { filingStatuses } from "@/lib/taxData";
import type { FilingStatus } from "@/lib/types";

const STATUS_ICONS: Record<FilingStatus, React.ReactNode> = {
  single: <User />,
  married_joint: <Users />,
  head_of_household: <House />,
  married_separate: <UserMinus />,
};

export function StepPlace({
  stateCode,
  filingStatus,
  onStateChange,
  onFilingStatusChange,
  onNext,
}: {
  stateCode: string;
  filingStatus: FilingStatus;
  onStateChange: (code: string) => void;
  onFilingStatusChange: (status: FilingStatus) => void;
  onNext: () => void;
}) {
  return (
    <StepCard
      icon={<MapPin />}
      eyebrow="Step 1 of 5"
      title="Where do you file?"
      footer={<StepNav onNext={onNext} />}
    >
      <StateSearch
        label="State of residence"
        value={stateCode}
        onChange={onStateChange}
      />

      <ChoiceGroup
        label="Federal filing status"
        value={filingStatus}
        onChange={(value) => onFilingStatusChange(value as FilingStatus)}
        choices={filingStatuses.map((status) => ({
          value: status.id,
          label: status.label,
          icon: STATUS_ICONS[status.id],
        }))}
      />
    </StepCard>
  );
}
