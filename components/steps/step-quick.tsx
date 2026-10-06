"use client";

import { Info } from "lucide-react";
import { Disclosure } from "@/components/ui-extras/disclosure";
import { ChoiceGroup } from "@/components/wizard/choice-group";
import { MoneyField } from "@/components/wizard/money-field";
import { StateSearch } from "@/components/wizard/state-search";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { formatCurrency, formatPercent, parseMoney } from "@/lib/format";
import { calculateCharitableLimit } from "@/lib/tax";
import { filingStatuses } from "@/lib/taxData";
import type {
  CharitableLimit,
  CharityType,
  FilingStatus,
  PropertyType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The whole quick estimate on one screen. Income and the gift come first and
 * are all most people need; who it goes to, where you live and the rarely used
 * itemized-deductions field follow in the order they matter.
 */
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
  const itemized = parseMoney(itemizedText);
  const limit = calculateCharitableLimit(donation, agi, charityType, propertyType);

  return (
    <StepCard
      title="Quick estimate"
      subtitle="Use last year's figures, or your best guess for this year."
      footer={
        <StepNav
          onNext={onNext}
          // The disabled button says why, so no separate warning is needed.
          nextLabel={agi > 0 ? "See results" : "Enter your income"}
          nextDisabled={agi <= 0}
        />
      }
    >
      <div className="space-y-5">
        <MoneyField
          label="Income (AGI)"
          value={agiText}
          onChange={onAgiChange}
          placeholder="85,000"
        />

        <MoneyField
          label="Gift or khums amount"
          value={donationText}
          onChange={onDonationChange}
          tone="give"
        />
      </div>

      <div className="space-y-4">
        <ChoiceGroup<CharityType>
          label="Who receives it"
          value={charityType}
          onChange={onCharityTypeChange}
          choices={[
            { value: "public", label: "Public charity", detail: "Church, mosque, 501(c)(3)" },
            { value: "private", label: "Private foundation" },
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

        <LimitFeedback agi={agi} donation={donation} limit={limit} />

        <p
          role="note"
          className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
        >
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-note-ink" />
          <span>
            In general, US churches and mosques are public charities, but
            verify the foundation&apos;s official IRS classification. Your
            deduction is capped based on your selection.
          </span>
        </p>
      </div>

      <div className="space-y-5">
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
      </div>

      <Disclosure
        title="Other itemized deductions"
        aside={
          itemized > 0 ? <span className="tnum">{formatCurrency(itemized)}</span> : null
        }
        defaultOpen={itemized > 0}
      >
        <div className="space-y-3">
          <MoneyField
            label="Mortgage interest, state taxes, medical…"
            value={itemizedText}
            onChange={onItemizedChange}
            placeholder="0"
            size="md"
          />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your gift only lowers your tax once these plus the gift beat the
            standard deduction. Leave blank if unsure.
          </p>
        </div>
      </Disclosure>
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
  limit: CharitableLimit;
}) {
  const over = limit.carryforward > 0;
  const judged = agi > 0 && donation > 0;

  return (
    <div
      aria-live="polite"
      className={cn(
        "rounded-2xl px-4 py-3",
        judged ? (over ? "bg-tax-soft" : "bg-keep-soft") : "bg-muted",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 text-sm text-muted-foreground">
          Deduction ceiling · {formatPercent(limit.rate, 0)} of AGI
        </p>
        <p className="tnum shrink-0 font-semibold whitespace-nowrap">
          {agi > 0 ? formatCurrency(limit.ceiling) : "—"}
        </p>
      </div>

      {judged ? (
        <p
          className={cn(
            "mt-1 text-sm leading-snug",
            over ? "text-tax-ink" : "text-keep-ink",
          )}
        >
          {over
            ? `${formatCurrency(limit.carryforward)} over the limit — that part carries forward up to five years.`
            : "Your gift is within the limit."}
        </p>
      ) : null}
    </div>
  );
}
