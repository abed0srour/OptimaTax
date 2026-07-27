import { Card, CardHeader, Row } from "@/components/Card";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { KhumsBreakdown } from "@/lib/types";

/**
 * Tracks the 1/5 khums obligation on net profit against what the user has
 * actually pledged to their 501(c)(3), and names the state the two are in.
 */
export function KhumsPanel({
  khums,
  donation,
  netProfit,
}: {
  khums: KhumsBreakdown;
  donation: number;
  netProfit: number;
}) {
  const pct = Math.round(khums.coverage * 100);
  const status = describeStatus(khums, donation, netProfit);

  return (
    <Card>
      <CardHeader
        title="Khums integration"
        subtitle="One fifth (20%) of net profit remaining after the year's expenses"
        badge={
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${status.chip}`}
          >
            {status.label}
          </span>
        }
      />

      <div className="px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600/80 dark:text-indigo-400/80">
              Khums obligation
            </p>
            <p className="tnum text-3xl font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
              {formatCurrency(khums.obligation)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Covered by your donation
            </p>
            <p className="tnum text-xl font-bold text-slate-900 dark:text-slate-50">
              {formatCurrency(khums.fulfilled)}{" "}
              <span className="text-sm font-semibold text-slate-400">
                / {pct}%
              </span>
            </p>
          </div>
        </div>

        <div
          className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Share of khums obligation covered by the donation"
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-4 space-y-2.5">
          <Row
            label="Donation to 501(c)(3)"
            value={formatCurrency(donation)}
            hint="Total amount you plan to give this year"
          />
          <Row
            label="Applied to khums"
            value={formatCurrency(khums.fulfilled)}
            tone="default"
          />
          <Row
            label="Khums still outstanding"
            value={formatCurrency(khums.remaining)}
            tone={khums.remaining > 0 ? "negative" : "positive"}
          />
          <Row
            label="Extra giving beyond khums"
            value={formatCurrency(khums.surplus)}
            hint="Sadaqah — deductible, but above the 1/5 obligation"
            tone="muted"
          />
          <Row
            label="Khums as a share of net profit"
            value={formatPercent(netProfit > 0 ? khums.obligation / netProfit : 0, 0)}
            emphasis
          />
        </div>

        <p className="mt-4 rounded-xl bg-indigo-50 px-3.5 py-3 text-[11px] leading-relaxed text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-200">
          {status.detail}
        </p>
      </div>
    </Card>
  );
}

function describeStatus(khums: KhumsBreakdown, donation: number, netProfit: number) {
  if (netProfit <= 0) {
    return {
      label: "No surplus",
      chip: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      detail:
        "Expenses meet or exceed income, so there is no net surplus for the year and no khums is calculated on it.",
    };
  }

  if (donation <= 0) {
    return {
      label: "Unfunded",
      chip: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
      detail: `Your khums obligation for the year is ${formatCurrency(
        khums.obligation,
      )}. Enter a donation amount to see how directing it through a 501(c)(3) both fulfils the obligation and lowers your tax bill.`,
    };
  }

  if (khums.remaining > 0) {
    return {
      label: "Partly covered",
      chip: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
      detail: `Your donation covers ${formatPercent(khums.coverage, 0)} of the obligation. A further ${formatCurrency(
        khums.remaining,
      )} would fully discharge the khums due on this year's surplus.`,
    };
  }

  if (khums.surplus > 0) {
    return {
      label: "Fully covered",
      chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
      detail: `The khums obligation of ${formatCurrency(
        khums.obligation,
      )} is fully met, with ${formatCurrency(
        khums.surplus,
      )} given beyond it as voluntary sadaqah — also deductible, subject to the AGI ceiling.`,
    };
  }

  return {
    label: "Exactly met",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
    detail: `Your donation of ${formatCurrency(
      donation,
    )} matches the khums obligation precisely — the full 1/5 of net profit is directed to charity.`,
  };
}
