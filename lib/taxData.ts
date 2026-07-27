import federalJson from "@/data/federal_tax.json";
import stateJson from "@/data/state_tax.json";
import type {
  Bracket,
  FederalTaxData,
  FilingStatus,
  RawBracket,
  StateTaxData,
  StateTaxEntry,
} from "./types";

export const federalTax = federalJson as unknown as FederalTaxData;
const stateTaxRaw = stateJson as unknown as StateTaxData;

export const taxYear = federalTax.tax_year;
export const stateTaxYear = stateTaxRaw.jurisdiction_year;

export const FILING_STATUS_IDS: FilingStatus[] = [
  "single",
  "married_joint",
  "head_of_household",
  "married_separate",
];

/**
 * Both JSON files list brackets the way the IRS prints them, with each `min`
 * one dollar above the previous `max` (…12,400 / 12,401…). Read literally that
 * leaves a one-dollar hole at every boundary, so snap each `min` down to the
 * previous `max` and treat the range as half-open `[min, max)`.
 */
export function normalizeBrackets(brackets: RawBracket[] = []): Bracket[] {
  let floor = 0;
  return brackets.map((bracket) => {
    const normalized: Bracket = { rate: bracket.rate, min: floor, max: bracket.max };
    floor = bracket.max ?? Number.POSITIVE_INFINITY;
    return normalized;
  });
}

/**
 * States that grant no deduction for charitable contributions, so a donation
 * produces no state-level saving there. This is a statutory fact rather than a
 * yearly rate, and the 2026 dataset does not carry it, so it lives here.
 */
const NO_CHARITABLE_DEDUCTION: Record<string, string> = {
  CT: "Connecticut allows no itemized deductions, so the donation lowers the federal bill only.",
  IL: "Illinois taxes federal AGI with no itemized deductions, so the donation lowers the federal bill only.",
  IN: "Indiana allows no charitable deduction against state income tax.",
  MI: "Michigan allows no charitable deduction against state income tax.",
  NJ: "New Jersey allows no charitable deduction against gross income tax.",
  OH: "Ohio allows no charitable deduction against state income tax.",
  PA: "Pennsylvania allows no charitable deduction against personal income tax.",
  RI: "Rhode Island eliminated itemized deductions, so the donation lowers the federal bill only.",
  WV: "West Virginia allows no charitable deduction against state income tax.",
};

/** All 50 states + DC, resolved and sorted alphabetically by name. */
export const states: StateTaxEntry[] = Object.entries(stateTaxRaw.states)
  .map(([code, entry]): StateTaxEntry => ({
    code,
    name: entry.name,
    tax_type: entry.tax_type,
    rate: entry.tax_type === "flat" ? entry.rate : undefined,
    brackets: entry.tax_type === "graduated" ? normalizeBrackets(entry.brackets) : [],
    allowsCharitableDeduction: !(code in NO_CHARITABLE_DEDUCTION),
    note: NO_CHARITABLE_DEDUCTION[code],
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const stateByCode = new Map(states.map((state) => [state.code, state]));

export function getState(code: string): StateTaxEntry {
  const entry = stateByCode.get(code);
  if (!entry) throw new Error(`Unknown state code: ${code}`);
  return entry;
}

export const filingStatuses = FILING_STATUS_IDS.map((id) => ({
  id,
  label: federalTax.ordinary_income_tax.filing_statuses[id].name,
}));

export function federalStandardDeduction(status: FilingStatus): number {
  return federalTax.ordinary_income_tax.filing_statuses[status].standard_deduction;
}

export function federalBrackets(status: FilingStatus): Bracket[] {
  return normalizeBrackets(
    federalTax.ordinary_income_tax.filing_statuses[status].brackets,
  );
}

/**
 * Long-term capital gains and qualified dividend brackets. Present in the data
 * and typed for use, but the dashboard currently models ordinary income only.
 */
export function capitalGainsBrackets(status: FilingStatus): Bracket[] {
  return normalizeBrackets(
    federalTax.long_term_capital_gains_and_qualified_dividends.filing_statuses[status]
      .brackets,
  );
}

export const dataNotes = {
  federalSource: federalTax.source,
  federalNotes: federalTax.notes,
  stateNotes: stateTaxRaw.notes,
};
