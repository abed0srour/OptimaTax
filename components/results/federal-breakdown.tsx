import { Landmark } from "lucide-react";
import { Disclosure } from "@/components/ui-extras/disclosure";
import { formatCurrency } from "@/lib/format";
import type { ScenarioBreakdown } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * What the federal total is actually made of. Bracket tax is only one piece —
 * self-employment tax alone can outweigh it — so the components are listed
 * rather than left implied by a single number.
 */
export function FederalBreakdown({ scenario }: { scenario: ScenarioBreakdown }) {
  const {
    federal,
    capitalGains,
    credits,
    selfEmployment,
    ficaWithheld,
    additionalMedicare,
    netInvestmentIncomeTax,
    totalFederalTax,
  } = scenario;

  const rows: { label: string; value: number; credit?: boolean }[] = [
    { label: "Income tax (ordinary rates)", value: federal.tax },
    { label: "Long-term capital gains tax", value: capitalGains.tax },
    { label: "Dependent credits", value: credits.applied, credit: true },
    { label: "Self-employment tax", value: selfEmployment.total },
    { label: "FICA withheld from wages", value: ficaWithheld },
    { label: "Additional Medicare tax", value: additionalMedicare },
    { label: "Net investment income tax", value: netInvestmentIncomeTax },
  ].filter((row) => row.value > 0);

  return (
    <Disclosure
      icon={<Landmark />}
      title="What makes up the federal tax"
      aside={<span className="tnum">{formatCurrency(totalFederalTax)}</span>}
      className="bg-card"
    >
      <dl className="space-y-2.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-3"
          >
            <dt className="min-w-0 text-[0.85rem] text-foreground/80">
              {row.label}
            </dt>
            <dd
              className={cn(
                "tnum shrink-0 text-[0.85rem] font-medium whitespace-nowrap",
                row.credit && "text-keep-ink",
              )}
            >
              {row.credit
                ? `−${formatCurrency(row.value)}`
                : formatCurrency(row.value)}
            </dd>
          </div>
        ))}

        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2.5">
          <dt className="min-w-0 text-[0.85rem] font-semibold">Total federal</dt>
          <dd className="tnum shrink-0 text-[0.9rem] font-semibold whitespace-nowrap">
            {formatCurrency(totalFederalTax)}
          </dd>
        </div>
      </dl>

      {credits.phasedOut > 0 ? (
        <p className="mt-3 text-[0.8rem] leading-relaxed text-muted-foreground">
          {formatCurrency(credits.phasedOut)} of your dependent credits was lost
          to the income phaseout.
        </p>
      ) : null}
    </Disclosure>
  );
}
