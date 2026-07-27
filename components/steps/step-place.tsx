"use client";

import { MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ChoiceGroup } from "@/components/wizard/choice-group";
import { StateCombobox } from "@/components/wizard/state-combobox";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { filingStatuses } from "@/lib/taxData";
import type { FilingStatus } from "@/lib/types";

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
      <div className="space-y-2">
        <Label className="text-[0.9rem] font-medium">State of residence</Label>
        <StateCombobox value={stateCode} onChange={onStateChange} />
      </div>

      <ChoiceGroup
        label="Federal filing status"
        value={filingStatus}
        onChange={(value) => onFilingStatusChange(value as FilingStatus)}
        choices={filingStatuses.map((status) => ({
          value: status.id,
          label: status.label,
        }))}
      />
    </StepCard>
  );
}
