export type FilingStatus =
  | "single"
  | "married_joint"
  | "head_of_household"
  | "married_separate";

export type StateTaxType = "none" | "flat" | "graduated";

/**
 * A bracket exactly as it appears in the JSON, following the IRS table
 * convention where `min` sits one dollar above the previous bracket's `max`.
 * Never hand these to the engine — run them through `normalizeBrackets` first.
 */
export interface RawBracket {
  rate: number;
  min: number;
  max: number | null;
}

/**
 * A bracket with half-open `[min, max)` bounds, so consecutive brackets meet
 * exactly and no dollar falls through a boundary. `max: null` is open-ended.
 */
export interface Bracket {
  rate: number;
  min: number;
  max: number | null;
}

// ---------------------------------------------------------------- data files

export interface FederalTaxData {
  tax_year: number;
  source: string;
  notes: string;
  ordinary_income_tax: {
    filing_statuses: Record<
      FilingStatus,
      { name: string; standard_deduction: number; brackets: RawBracket[] }
    >;
  };
  long_term_capital_gains_and_qualified_dividends: {
    notes: string;
    filing_statuses: Record<FilingStatus, { brackets: RawBracket[] }>;
  };
  net_investment_income_tax: {
    name: string;
    rate: number;
    notes: string;
    magi_thresholds: Record<FilingStatus, number>;
  };
  additional_medicare_tax: {
    name: string;
    rate: number;
    notes: string;
    wage_thresholds: Record<FilingStatus, number>;
  };
  personal_exemption: { amount: number; notes: string };
  charitable_deduction_limits: {
    notes: string;
    cash_public_charity_agi_limit: number;
  };
}

export interface RawStateEntry {
  name: string;
  tax_type: StateTaxType;
  /** Present for `flat` states; `none` states carry a literal 0. */
  rate?: number;
  /** Present for `graduated` states only. Single-filer schedule. */
  brackets?: RawBracket[];
}

export interface StateTaxData {
  jurisdiction_year: number;
  notes: string;
  /** Keyed by two-letter postal code. */
  states: Record<string, RawStateEntry>;
}

// ------------------------------------------------------------ resolved state

/** A state after the loader has keyed it, normalized it, and annotated it. */
export interface StateTaxEntry {
  code: string;
  name: string;
  tax_type: StateTaxType;
  rate?: number;
  /** Normalized half-open brackets. Empty for `none` and `flat` states. */
  brackets: Bracket[];
  /** False where the state grants no deduction for charitable contributions. */
  allowsCharitableDeduction: boolean;
  /** Caveat surfaced in the UI for this specific state, if any. */
  note?: string;
}

// ----------------------------------------------------------------- results

/** One line of the "which bracket contributed what" audit trail. */
export interface BracketSlice {
  rate: number;
  min: number;
  max: number | null;
  /** Portion of taxable income that landed inside this bracket. */
  amountInBracket: number;
  tax: number;
}

export interface ProgressiveResult {
  tax: number;
  slices: BracketSlice[];
  /** Blended rate across all taxable income. */
  effectiveRate: number;
  /** Rate on the next dollar earned. */
  marginalRate: number;
}

export interface ScenarioBreakdown {
  label: string;
  /** Charitable amount actually subtracted before tax in this scenario. */
  donationApplied: number;
  federalTaxableIncome: number;
  stateTaxableIncome: number;
  federal: ProgressiveResult;
  state: ProgressiveResult;
  totalTax: number;
  /** Net profit minus total tax, before the donation leaves your hands. */
  afterTaxIncome: number;
  /** What you actually retain: after-tax income minus the donation you gave. */
  retainedAfterGiving: number;
}

export interface KhumsBreakdown {
  /** 1/5 of net profit. */
  obligation: number;
  /** Donation counted against the obligation (never more than the obligation). */
  fulfilled: number;
  /** Obligation still outstanding. */
  remaining: number;
  /** Donation above and beyond the obligation (sadaqah / extra giving). */
  surplus: number;
  /** 0–1 share of the obligation covered by the donation. */
  coverage: number;
}

export interface BracketTarget {
  /** Marginal federal rate the donor currently sits in. */
  currentRate: number;
  /** Marginal federal rate one bracket down. */
  targetRate: number;
  /** Total donation (not incremental) that lands taxable income at the bracket floor. */
  targetDonation: number;
  /** How much more to give, on top of what's already entered, to get there. */
  additionalDonationNeeded: number;
}

export interface TaxComparison {
  netProfit: number;
  donationEntered: number;
  /** Donation after applying the federal AGI ceiling for cash gifts. */
  deductibleDonation: number;
  /** Donation above the AGI ceiling, carried forward up to five years. */
  donationCarryforward: number;
  agiLimitAmount: number;
  khums: KhumsBreakdown;
  /** Null once already in the lowest federal bracket — there's nowhere lower to go. */
  bracketTarget: BracketTarget | null;
  scenarioA: ScenarioBreakdown;
  scenarioB: ScenarioBreakdown;
  /** scenarioA.totalTax − scenarioB.totalTax. */
  taxSavings: number;
  /** Donation minus the tax it saved you — the real out-of-pocket cost. */
  netCostOfGiving: number;
  /** taxSavings / donation, i.e. the share of the gift the tax code absorbs. */
  givingDiscount: number;
  stateAllowsCharitableDeduction: boolean;
  stateEntry: StateTaxEntry;
}

/**
 * How the charitable deduction stacks against the standard deduction.
 * - `stacked`   — subtract both (the model requested in the project brief).
 * - `itemized`  — IRS rule: take the greater of the standard deduction or the
 *                 itemized total.
 */
export type DeductionMode = "stacked" | "itemized";

export interface CalculatorInput {
  totalIncome: number;
  expenses: number;
  donation: number;
  filingStatus: FilingStatus;
  stateCode: string;
  deductionMode: DeductionMode;
}
