"use client";

import { useId } from "react";
import { formatMoneyInput } from "@/lib/format";

const labelClass =
  "block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400";

const controlClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition " +
  "placeholder:font-normal placeholder:text-slate-400 " +
  "hover:border-slate-400 " +
  "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 " +
  "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 " +
  "dark:hover:border-slate-600 dark:focus:border-emerald-400";

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: SelectFieldProps<T>) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          className={`${controlClass} cursor-pointer appearance-none pr-9`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {hint ? (
        <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

interface CurrencyFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  accent?: "default" | "emerald" | "indigo";
  action?: { label: string; onClick: () => void; title?: string };
}

const accentRing: Record<NonNullable<CurrencyFieldProps["accent"]>, string> = {
  default: "focus:border-emerald-500 focus:ring-emerald-500/30 dark:focus:border-emerald-400",
  emerald: "focus:border-emerald-500 focus:ring-emerald-500/30 dark:focus:border-emerald-400",
  indigo: "focus:border-indigo-500 focus:ring-indigo-500/30 dark:focus:border-indigo-400",
};

export function CurrencyField({
  label,
  value,
  onChange,
  placeholder = "0",
  hint,
  accent = "default",
  action,
}: CurrencyFieldProps) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            title={action.title}
            className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
          >
            {action.label}
          </button>
        ) : null}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
          $
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(formatMoneyInput(event.target.value))}
          className={`${controlClass} tnum pl-7 ${accentRing[accent]}`}
        />
      </div>
      {hint ? (
        <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
