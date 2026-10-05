"use client";

import { ChoiceGroup } from "@/components/wizard/choice-group";
import { CountField } from "@/components/wizard/count-field";
import { StateSearch } from "@/components/wizard/state-search";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { filingStatuses } from "@/lib/taxData";
import type { Dependents, FilingStatus } from "@/lib/types";

export function StepPlace({
  stateCode,
  filingStatus,
  dependents,
  onStateChange,
  onFilingStatusChange,
  onDependentsChange,
  onNext,
}: {
  stateCode: string;
  filingStatus: FilingStatus;
  dependents: Dependents;
  onStateChange: (code: string) => void;
  onFilingStatusChange: (status: FilingStatus) => void;
  onDependentsChange: (dependents: Dependents) => void;
  onNext: () => void;
}) {
  return (
    <StepCard title="About you" footer={<StepNav onNext={onNext} />}>
      <StateSearch
        label="State you live in"
        value={stateCode}
        onChange={onStateChange}
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

      <div>
        <p className="text-sm font-medium">Dependents</p>
        <div className="mt-1 divide-y divide-border">
          <CountField
            label="Children under 17"
            hint="Up to $2,200 each off your tax."
            value={dependents.qualifyingChildren}
            onChange={(qualifyingChildren) =>
              onDependentsChange({ ...dependents, qualifyingChildren })
            }
          />
          <CountField
            label="Other dependents"
            hint="Parents, relatives, older children — $500 each."
            value={dependents.otherDependents}
            onChange={(otherDependents) =>
              onDependentsChange({ ...dependents, otherDependents })
            }
          />
        </div>
      </div>
    </StepCard>
  );
}
