import federal2025Json from "@/data/federal_tax_2025.json";
import federal2026Json from "@/data/federal_tax_2026.json";
import state2025Json from "@/data/state_tax_2025.json";
import state2026Json from "@/data/state_tax_2026.json";
import type {
  Bracket,
  FederalTaxData,
  FilingStatus,
  RawBracket,
  StateTaxData,
  StateTaxEntry,
  TaxYear,
} from "./types";

/**
 * Federal figures by tax year. Adding a year takes a new
 * `data/federal_tax_<year>.json` and `data/state_tax_<year>.json`, an entry
 * here and in `STATE_TAX`, and the year in the `TaxYear` union — the `Record`
 * types won't compile until all agree.
 */
const FEDERAL_TAX: Record<TaxYear, FederalTaxData> = {
  2025: federal2025Json as unknown as FederalTaxData,
  2026: federal2026Json as unknown as FederalTaxData,
};

/**
 * State schedules by tax year. A year may borrow another year's file while its
 * own is missing; its `jurisdiction_year` keeps that visible, because the
 * results screen flags any year whose state schedules come from a different year.
 */
const STATE_TAX: Record<TaxYear, StateTaxData> = {
  2025: state2025Json as unknown as StateTaxData,
  2026: state2026Json as unknown as StateTaxData,
};

/** The years the calculator can switch between, oldest first. */
export const TAX_YEARS = (Object.keys(FEDERAL_TAX).map(Number) as TaxYear[]).sort(
  (a, b) => a - b,
);

/** The newest year on file — what the calculator opens on. */
export const DEFAULT_TAX_YEAR: TaxYear = TAX_YEARS[TAX_YEARS.length - 1];

export function getFederalTax(year: TaxYear): FederalTaxData {
  return FEDERAL_TAX[year];
}

/** The year of the state schedules applied when computing `year`. */
export function stateTaxYear(year: TaxYear): number {
  return STATE_TAX[year].jurisdiction_year;
}

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
 * All 50 states + DC, resolved and sorted alphabetically by name. Whether a
 * gift deducts is read per year, because states do repeal and restore it.
 */
function resolveStates(data: StateTaxData): StateTaxEntry[] {
  return Object.entries(data.states)
    .map(([code, entry]): StateTaxEntry => ({
      code,
      name: entry.name,
      tax_type: entry.tax_type,
      rate: entry.tax_type === "flat" ? entry.rate : undefined,
      brackets: entry.tax_type === "graduated" ? normalizeBrackets(entry.brackets) : [],
      standardDeduction: entry.standard_deduction,
      standardDeductionPhaseout: entry.standard_deduction_phaseout ?? [],
      personalExemption: entry.personal_exemption,
      personalExemptionPhaseout: entry.personal_exemption_phaseout ?? [],
      allowsCharitableDeduction: entry.charitable_deduction,
      note: entry.note,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const stateByCodeByYear = Object.fromEntries(
  TAX_YEARS.map((year) => [
    year,
    new Map(resolveStates(STATE_TAX[year]).map((state) => [state.code, state])),
  ]),
) as Record<TaxYear, Map<string, StateTaxEntry>>;

/** The state picker's list. Names and codes are the same in every year. */
export const states: StateTaxEntry[] = [
  ...stateByCodeByYear[DEFAULT_TAX_YEAR].values(),
];

export function getState(code: string, year: TaxYear): StateTaxEntry {
  const entry = stateByCodeByYear[year].get(code);
  if (!entry) throw new Error(`Unknown state code: ${code}`);
  return entry;
}

export const filingStatuses = FILING_STATUS_IDS.map((id) => ({
  id,
  label: FEDERAL_TAX[DEFAULT_TAX_YEAR].ordinary_income_tax.filing_statuses[id].name,
}));

export function federalStandardDeduction(status: FilingStatus, year: TaxYear): number {
  return FEDERAL_TAX[year].ordinary_income_tax.filing_statuses[status].standard_deduction;
}

export function federalBrackets(status: FilingStatus, year: TaxYear): Bracket[] {
  return normalizeBrackets(
    FEDERAL_TAX[year].ordinary_income_tax.filing_statuses[status].brackets,
  );
}

/** Long-term capital gains and qualified dividend brackets, stacked on ordinary income. */
export function capitalGainsBrackets(status: FilingStatus, year: TaxYear): Bracket[] {
  return normalizeBrackets(
    FEDERAL_TAX[year].long_term_capital_gains_and_qualified_dividends.filing_statuses[status]
      .brackets,
  );
}
