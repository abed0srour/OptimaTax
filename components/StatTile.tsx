import type { ReactNode } from "react";

export type StatTone = "slate" | "emerald" | "indigo" | "rose";

const toneStyles: Record<StatTone, { wrap: string; value: string; label: string }> = {
  slate: {
    wrap: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
    value: "text-slate-900 dark:text-slate-50",
    label: "text-slate-500 dark:text-slate-400",
  },
  emerald: {
    wrap: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10",
    value: "text-emerald-700 dark:text-emerald-300",
    label: "text-emerald-700/70 dark:text-emerald-400/80",
  },
  indigo: {
    wrap: "border-indigo-200 bg-indigo-50 dark:border-indigo-500/25 dark:bg-indigo-500/10",
    value: "text-indigo-700 dark:text-indigo-300",
    label: "text-indigo-700/70 dark:text-indigo-400/80",
  },
  rose: {
    wrap: "border-rose-200 bg-rose-50 dark:border-rose-500/25 dark:bg-rose-500/10",
    value: "text-rose-700 dark:text-rose-300",
    label: "text-rose-700/70 dark:text-rose-400/80",
  },
};

export function StatTile({
  label,
  value,
  detail,
  tone = "slate",
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: StatTone;
  icon?: ReactNode;
}) {
  const styles = toneStyles[tone];

  return (
    <div className={`rounded-2xl border px-4 py-3.5 shadow-sm shadow-slate-900/5 ${styles.wrap}`}>
      <div className="flex items-center gap-1.5">
        {icon ? <span className={styles.label}>{icon}</span> : null}
        <p
          className={`text-[11px] font-semibold uppercase tracking-wider ${styles.label}`}
        >
          {label}
        </p>
      </div>
      <p className={`tnum mt-1.5 text-2xl font-bold tracking-tight ${styles.value}`}>
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-xs leading-snug text-slate-500 dark:text-slate-400">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
