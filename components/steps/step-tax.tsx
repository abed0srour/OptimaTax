"use client";

import { HandHeart, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Readout } from "@/components/wizard/readout";
import { StepCard } from "@/components/wizard/step-card";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { ScenarioBreakdown, StateTaxEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

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
        <CardFooter className="flex-col-reverse gap-2 bg-muted/40 px-4 py-3 sm:flex-row sm:justify-between sm:gap-3 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="h-10 w-full px-3 text-[0.9rem] sm:w-auto"
          >
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>
          <Button
            type="button"
            onClick={onDonate}
            className="h-10 w-full px-5 text-[0.9rem] sm:w-auto"
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
        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
          <dt className="min-w-0 text-[0.9rem] font-semibold">
            Net income after tax
          </dt>
          <dd className="tnum shrink-0 text-lg font-semibold whitespace-nowrap">
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
    <div className="flex items-baseline justify-between gap-3">
      <dt className="min-w-0 text-[0.9rem] text-foreground/80">{label}</dt>
      <dd
        className={cn(
          "tnum shrink-0 font-medium whitespace-nowrap",
          muted && "text-muted-foreground",
        )}
      >
        {muted ? "None" : formatCurrency(value)}
      </dd>
    </div>
  );
}
