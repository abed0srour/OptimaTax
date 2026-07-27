import { formatBracketRange, formatCurrency, formatRate } from "@/lib/format";
import type { ProgressiveResult } from "@/lib/types";

/**
 * The chunk-by-chunk audit trail: which bracket each slice of income landed in
 * and what it cost. Collapsed by default so the scenario cards stay scannable.
 */
export function BracketTable({
  title,
  result,
  emptyMessage = "No tax due at this income level.",
}: {
  title: string;
  result: ProgressiveResult;
  emptyMessage?: string;
}) {
  return (
    <details className="group rounded-xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
        <span>{title}</span>
        <span className="flex items-center gap-2">
          <span className="tnum font-mono text-[11px] text-slate-500 dark:text-slate-500">
            {formatCurrency(result.tax)}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>

      <div className="overflow-x-auto border-t border-slate-200 px-1 pb-1 dark:border-slate-800">
        {result.slices.length === 0 ? (
          <p className="px-2.5 py-3 text-xs text-slate-500 dark:text-slate-400">
            {emptyMessage}
          </p>
        ) : (
          <table className="w-full min-w-[22rem] text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="px-2.5 py-2 font-semibold">Bracket</th>
                <th className="px-2.5 py-2 text-right font-semibold">Rate</th>
                <th className="px-2.5 py-2 text-right font-semibold">Taxed here</th>
                <th className="px-2.5 py-2 text-right font-semibold">Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {result.slices.map((slice) => (
                <tr key={`${slice.rate}-${slice.min}`}>
                  <td className="tnum whitespace-nowrap px-2.5 py-2 text-slate-600 dark:text-slate-400">
                    {formatBracketRange(slice.min, slice.max)}
                  </td>
                  <td className="tnum px-2.5 py-2 text-right font-semibold text-slate-700 dark:text-slate-300">
                    {formatRate(slice.rate)}
                  </td>
                  <td className="tnum px-2.5 py-2 text-right text-slate-600 dark:text-slate-400">
                    {formatCurrency(slice.amountInBracket)}
                  </td>
                  <td className="tnum px-2.5 py-2 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(slice.tax)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </details>
  );
}
