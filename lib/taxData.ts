import federalJson from "@/data/federal_tax.json";
import stateJson from "@/data/state_tax.json";
import type {
  ByStatus,
  FederalTaxData,
  FilingStatus,
  StateTaxData,
  StateTaxEntry,
} from "./types";

export const federalTax = federalJson as FederalTaxData;
export const stateTax = stateJson as unknown as StateTaxData;

/** All 50 states + DC, alphabetical by name. */
export const states: StateTaxEntry[] = [...stateTax.states].sort((a, b) =>
  a.name.localeCompare(b.name),
);

export const filingStatuses = federalTax.filing_statuses;

const stateByCode = new Map(states.map((s) => [s.code, s]));

export function getState(code: string): StateTaxEntry {
  const entry = stateByCode.get(code);
  if (!entry) throw new Error(`Unknown state code: ${code}`);
  return entry;
}

/** Resolves `map[status]`, falling back to `map.default`, then to `fallback`. */
export function resolveByStatus<T>(
  map: ByStatus<T> | undefined,
  status: FilingStatus,
  fallback: T,
): T {
  if (!map) return fallback;
  return map[status] ?? map.default ?? fallback;
}

export function federalStandardDeduction(status: FilingStatus): number {
  return federalTax.standard_deductions[status] ?? 0;
}

export function stateStandardDeduction(
  state: StateTaxEntry,
  status: FilingStatus,
): number {
  return resolveByStatus(state.standard_deduction, status, 0);
}
