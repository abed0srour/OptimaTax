"use client";

import { Baby, House, MapPin, User, UserMinus, Users } from "lucide-react";
import { ChoiceGroup } from "@/components/wizard/choice-group";
import { CountField } from "@/components/wizard/count-field";
import { StateSearch } from "@/components/wizard/state-search";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { filingStatuses } from "@/lib/taxData";
import type { Dependents, FilingStatus } from "@/lib/types";

const STATUS_ICONS: Record<FilingStatus, React.ReactNode> = {
  single: <User />,
  married_joint: <Users />,
  head_of_household: <House />,
  married_separate: <UserMinus />,
};

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
    <StepCard
      icon={<MapPin />}
      eyebrow="Step 1 of 5"
      title="About you"
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

      <div className="space-y-2">
        <p className="text-[0.9rem] font-medium">Dependents</p>

        <CountField
          label="Children under 17"
          hint="Worth up to $2,200 each off your tax bill."
          icon={<Baby />}
          value={dependents.qualifyingChildren}
          onChange={(qualifyingChildren) =>
            onDependentsChange({ ...dependents, qualifyingChildren })
          }
        />

        <CountField
          label="Other dependents"
          hint="Older children, parents, relatives you support — $500 each."
          icon={<Users />}
          value={dependents.otherDependents}
          onChange={(otherDependents) =>
            onDependentsChange({ ...dependents, otherDependents })
          }
        />
      </div>
    </StepCard>
  );
}
