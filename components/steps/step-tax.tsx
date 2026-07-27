"use client";

import { HandHeart, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Readout } from "@/components/wizard/readout";
import { StepCard } from "@/components/wizard/step-card";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { ScenarioBreakdown, StateTaxEntry } from "@/lib/types";

/**
 * The bill as it stands, before any giving. Its job is to make the next step —
 * routing khums through a 501(c)(3) — feel like the obvious move.
 */
export function StepTax({
  scenario,
  stateEntry,
  onBack,
  onDonate,
}: {
  scenario: ScenarioBreakdown;
  stateEntry: StateTaxEntry;
  onBack: () => void;
  onDonate: () => void;
}) {
  return (
    <StepCard
      icon={<Landmark />}
      eyebrow="Step 3 of 5"
      title="This is what you owe"
      footer={
        <CardFooter className="flex-wrap justify-between gap-3 bg-muted/40 px-4 py-3 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="h-10 px-3 text-[0.9rem]"
          >
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>
          <Button
            type="button"
            onClick={onDonate}
            className="h-10 px-5 text-[0.9rem]"
          >
            <HandHeart data-icon="inline-start" />
            Give to a 501(c)(3)
          </Button>
        </CardFooter>
      }
    >
      <Readout
        label="Total tax due"
        value={formatCurrency(scenario.totalTax)}
        tone="tax"
      />

      <dl className="space-y-3">
        <Line label="Federal income tax" value={scenario.federal.tax} />
        <Line
          label={`${stateEntry.name} income tax`}
          value={scenario.state.tax}
          muted={stateEntry.tax_type === "none"}
        />
        <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
          <dt className="text-[0.9rem] font-semibold">You keep after tax</dt>
          <dd className="tnum text-lg font-semibold">
            {formatCurrency(scenario.afterTaxIncome)}
          </dd>
        </div>
      </dl>
    </StepCard>
  );
}

function Line({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[0.9rem] text-foreground/80">{label}</dt>
      <dd
        className={
          muted ? "tnum font-medium text-muted-foreground" : "tnum font-medium"
        }
      >
        {muted ? "None" : formatCurrency(value)}
      </dd>
    </div>
  );
}
