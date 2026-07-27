"use client";

import { MapPin, Percent, User } from "lucide-react";
import { formatRate } from "@/lib/format";
import { filingStatuses } from "@/lib/taxData";
import type { FilingStatus, TaxComparison } from "@/lib/types";

/**
 * The answers every later figure depends on, kept in view for the whole wizard.
 * The rate chips appear once there is income to apply them to — before that a
 * marginal rate would just be the bottom bracket, which is misleading.
 */
export function ContextBar({
  comparison,
  filingStatus,
}: {
  comparison: TaxComparison;
  filingStatus: FilingStatus;
}) {
  const { stateEntry, scenarioA, netProfit } = comparison;
  const status = filingStatuses.find((entry) => entry.id === filingStatus);
  const showRates = netProfit > 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Chip icon={<MapPin className="size-3.5 shrink-0" />}>
        {stateEntry.name}
        <span className="text-muted-foreground">{stateEntry.code}</span>
      </Chip>

      <Chip icon={<User className="size-3.5 shrink-0" />}>{status?.label}</Chip>

      {showRates ? (
        <Chip icon={<Percent className="size-3.5 shrink-0" />} tone="rate">
          Federal
          <span className="tnum font-semibold">
            {formatRate(scenarioA.federal.marginalRate)}
          </span>
        </Chip>
      ) : null}

      {showRates && stateEntry.tax_type !== "none" ? (
        <Chip icon={<Percent className="size-3.5 shrink-0" />} tone="rate">
          {stateEntry.code}
          <span className="tnum font-semibold">
            {formatRate(
              stateEntry.tax_type === "flat"
                ? (stateEntry.rate ?? 0)
                : scenarioA.state.marginalRate,
            )}
          </span>
        </Chip>
      ) : null}

      {showRates && stateEntry.tax_type === "none" ? (
        <Chip icon={<Percent className="size-3.5 shrink-0" />} tone="rate">
          {stateEntry.code}
          <span className="font-semibold">No income tax</span>
        </Chip>
      ) : null}
    </div>
  );
}

function Chip({
  icon,
  children,
  tone = "default",
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "rate";
}) {
  return (
    <span
      className={
        tone === "rate"
          ? "inline-flex min-w-0 items-center gap-1.5 rounded-full border border-tax/25 bg-tax-soft px-2.5 py-1 text-xs font-medium text-tax-ink"
          : "inline-flex min-w-0 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground/80"
      }
    >
      <span className={tone === "rate" ? "text-tax" : "text-muted-foreground"}>
        {icon}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 truncate">{children}</span>
    </span>
  );
}
