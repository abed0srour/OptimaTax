import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { KhumsBreakdown } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Tracks the 1/5 obligation on net profit against what the user has actually
 * pledged, and names the state the two are in.
 */
export function KhumsSummary({
  khums,
  donation,
  netProfit,
}: {
  khums: KhumsBreakdown;
  donation: number;
  netProfit: number;
}) {
  const coverage = Math.round(khums.coverage * 100);
  const status = describeStatus(khums, donation, netProfit);

  const rows = [
    { label: "Donation to 501(c)(3)", value: formatCurrency(donation) },
    { label: "Applied to khums", value: formatCurrency(khums.fulfilled) },
    {
      label: "Khums still outstanding",
      value: formatCurrency(khums.remaining),
      tone: khums.remaining > 0 ? ("warn" as const) : ("good" as const),
    },
    { label: "Extra giving beyond khums", value: formatCurrency(khums.surplus) },
  ];

  return (
    <Card className="rounded-2xl shadow-sm ring-foreground/8 [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>Khums</CardTitle>
        <CardDescription>
          One fifth of the surplus left after the year&apos;s expenses.
        </CardDescription>
        <CardAction>
          <Badge variant="outline" className={status.chip}>
            {status.label}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Obligation</p>
            <p className="tnum text-3xl font-semibold tracking-tight text-give-ink">
              {formatCurrency(khums.obligation)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground">Covered</p>
            <p className="tnum text-xl font-semibold">
              {formatCurrency(khums.fulfilled)}
              <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                {coverage}%
              </span>
            </p>
          </div>
        </div>

        <Progress
          value={coverage}
          className="h-2 **:data-[slot=progress-indicator]:bg-give"
          aria-label="Share of the khums obligation covered by the donation"
        />

        <dl className="space-y-2 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-foreground/75">{row.label}</dt>
              <dd
                className={cn(
                  "tnum font-medium",
                  row.tone === "warn" && "text-note-ink",
                  row.tone === "good" && "text-keep-ink",
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="rounded-xl bg-give-soft px-3.5 py-3 text-xs leading-relaxed text-give-ink">
          {status.detail}
        </p>
      </CardContent>
    </Card>
  );
}

function describeStatus(khums: KhumsBreakdown, donation: number, netProfit: number) {
  if (netProfit <= 0) {
    return {
      label: "No surplus",
      chip: "text-muted-foreground",
      detail:
        "Expenses meet or exceed income, so there is no net surplus this year and no khums is calculated on it.",
    };
  }

  if (donation <= 0) {
    return {
      label: "Unfunded",
      chip: "border-note/40 bg-note-soft text-note-ink",
      detail: `Your khums for the year is ${formatCurrency(
        khums.obligation,
      )}. Add a donation on the previous step to see how directing it through a 501(c)(3) both fulfils the obligation and lowers the tax bill.`,
    };
  }

  if (khums.remaining > 0) {
    return {
      label: "Partly covered",
      chip: "border-note/40 bg-note-soft text-note-ink",
      detail: `Your donation covers ${formatPercent(
        khums.coverage,
        0,
      )} of the obligation. A further ${formatCurrency(
        khums.remaining,
      )} would fully discharge the khums due on this year's surplus.`,
    };
  }

  if (khums.surplus > 0) {
    return {
      label: "Fully covered",
      chip: "border-keep/40 bg-keep-soft text-keep-ink",
      detail: `The obligation of ${formatCurrency(
        khums.obligation,
      )} is fully met, with ${formatCurrency(
        khums.surplus,
      )} given beyond it as voluntary sadaqah — also deductible, subject to the AGI ceiling.`,
    };
  }

  return {
    label: "Exactly met",
    chip: "border-keep/40 bg-keep-soft text-keep-ink",
    detail: `Your donation of ${formatCurrency(
      donation,
    )} matches the khums obligation precisely — the full one fifth of net profit is directed to charity.`,
  };
}
