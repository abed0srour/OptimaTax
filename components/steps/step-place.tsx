"use client";

import { MapPin } from "lucide-react";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { ChoiceGroup } from "@/components/wizard/choice-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatRate } from "@/lib/format";
import { federalStandardDeduction, filingStatuses, states, taxYear } from "@/lib/taxData";
import type { FilingStatus, StateTaxEntry } from "@/lib/types";

export function StepPlace({
  stateCode,
  filingStatus,
  stateEntry,
  onStateChange,
  onFilingStatusChange,
  onNext,
}: {
  stateCode: string;
  filingStatus: FilingStatus;
  stateEntry: StateTaxEntry;
  onStateChange: (code: string) => void;
  onFilingStatusChange: (status: FilingStatus) => void;
  onNext: () => void;
}) {
  return (
    <StepCard
      icon={<MapPin />}
      eyebrow="Step 1 of 4"
      title="Where do you file?"
      description={`Your state sets the second half of the tax bill, and your filing status sets the federal standard deduction. Everything below uses ${taxYear} figures.`}
      footer={<StepNav onNext={onNext} />}
    >
      <div className="space-y-2">
        <Label htmlFor="state-select" className="text-[0.9rem] font-medium">
          State of residence
        </Label>
        <Select value={stateCode} onValueChange={onStateChange}>
          <SelectTrigger
            id="state-select"
            className="h-12 w-full rounded-xl bg-card px-4 text-[0.95rem] font-medium"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {states.map((state) => (
              <SelectItem key={state.code} value={state.code}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {describeState(stateEntry)}
        </p>
      </div>

      <ChoiceGroup
        label="Federal filing status"
        value={filingStatus}
        onChange={(value) => onFilingStatusChange(value as FilingStatus)}
        choices={filingStatuses.map((status) => ({
          value: status.id,
          label: status.label,
          detail: `${formatCurrency(federalStandardDeduction(status.id))} standard deduction`,
        }))}
      />
    </StepCard>
  );
}

function describeState(state: StateTaxEntry): string {
  if (state.tax_type === "none") {
    return `${state.name} levies no state income tax on wage or business income — only the federal bill applies.`;
  }
  if (state.tax_type === "flat") {
    return `${state.name} taxes income at a flat ${formatRate(state.rate ?? 0)}.`;
  }
  return `${state.name} uses ${state.brackets.length} graduated brackets, from ${formatRate(
    state.brackets[0]?.rate ?? 0,
  )} up to ${formatRate(state.brackets[state.brackets.length - 1]?.rate ?? 0)}.`;
}
