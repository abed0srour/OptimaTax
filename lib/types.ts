export type FilingStatus =
  | "single"
  | "married_joint"
  | "head_of_household"
  | "married_separate";

export type StateTaxType = "none" | "flat" | "graduated";

/** A single progressive bracket. `max: null` marks the open-ended top bracket. */
export interface Bracket {
  rate: number;
  min: number;
  max: number | null;
}

/** Keyed by filing status, with `default` as the fallback for any missing key. */
export type ByStatus<T> = Partial<Record<FilingStatus, T>> & { default?: T };

export interface FederalTaxData {
  tax_year: number;
  source_note: string;
  filing_statuses: { id: FilingStatus; label: string }[];
  standard_deductions: Record<FilingStatus, number>;
  brackets: Record<FilingStatus, Bracket[]>;
  charitable_deduction_limits: {
    note: string;
    cash_public_charity_agi_limit: number;
  };
}

export interface StateTaxEntry {
  code: string;
  name: string;
  tax_type: StateTaxType;
  /** Present only when `tax_type === "flat"`. */
  rate?: number;
  /** Present only when `tax_type === "graduated"`. */
  brackets?: ByStatus<Bracket[]>;
  standard_deduction: ByStatus<number>;
  /** Absent means the state does allow a charitable deduction. */
  allows_charitable_deduction?: boolean;
  note?: string;
}

export interface StateTaxData {
  tax_year: number;
  source_note: string;
  lookup_rules: Record<string, string>;
  states: StateTaxEntry[];
}

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

export interface TaxComparison {
  netProfit: number;
  donationEntered: number;
  /** Donation after applying the federal AGI ceiling for cash gifts. */
  deductibleDonation: number;
  /** Donation above the AGI ceiling, carried forward up to five years. */
  donationCarryforward: number;
  agiLimitAmount: number;
  khums: KhumsBreakdown;
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
 * - `itemized`  — IRS rule: take the greater of the standard deduction or itemized total.
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
