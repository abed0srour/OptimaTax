import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      {badge}
    </header>
  );
}

/** A label/value row used throughout the scenario and khums panels. */
export function Row({
  label,
  value,
  hint,
  emphasis = false,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
  tone?: "default" | "positive" | "negative" | "muted";
}) {
  const toneClass = {
    default: "text-slate-900 dark:text-slate-50",
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-rose-600 dark:text-rose-400",
    muted: "text-slate-500 dark:text-slate-400",
  }[tone];

  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        emphasis ? "border-t border-slate-200 pt-2.5 dark:border-slate-800" : ""
      }`}
    >
      <div className="min-w-0">
        <span
          className={`text-sm ${
            emphasis
              ? "font-semibold text-slate-700 dark:text-slate-200"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          {label}
        </span>
        {hint ? (
          <span className="block text-[11px] leading-tight text-slate-400 dark:text-slate-500">
            {hint}
          </span>
        ) : null}
      </div>
      <span
        className={`tnum shrink-0 tabular-nums ${
          emphasis ? "text-base font-bold" : "text-sm font-semibold"
        } ${toneClass}`}
      >
        {value}
      </span>
    </div>
  );
}
