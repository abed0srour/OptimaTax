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
  self_employment_tax: {
    name: string;
    notes: string;
    net_earnings_factor: number;
    social_security_rate: number;
    medicare_rate: number;
    social_security_wage_base: number;
    minimum_net_earnings: number;
  };
  fica_employee: {
    name: string;
    notes: string;
    social_security_rate: number;
    medicare_rate: number;
  };
  child_tax_credit: {
    name: string;
    notes: string;
    amount_per_child: number;
    refundable_limit: number;
    other_dependent_credit: number;
    phaseout_step: number;
    phaseout_per: number;
    magi_thresholds: Record<FilingStatus, number>;
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

/**
 * Where a year's money came from. Each source is taxed differently, so they
 * cannot be collapsed into one figure without changing the answer.
 */
export interface IncomeSources {
  /** W-2 wages. FICA is withheld at source; ordinary rates for income tax. */
  wages: number;
  /** Gross 1099 / business revenue, before expenses. Carries SE tax. */
  selfEmployment: number;
  /** Long-term gains and qualified dividends — preferential 0/15/20% rates. */
  longTermCapitalGains: number;
  /** Interest, non-qualified dividends, short-term gains. Ordinary rates, and
   *  investment income for NIIT purposes. */
  otherInvestmentIncome: number;
}

export interface Dependents {
  /** Under 17 at year end — worth the full Child Tax Credit. */
  qualifyingChildren: number;
  /** Everyone else you claim — worth the smaller Other Dependent Credit. */
  otherDependents: number;
}

/** The payroll-style taxes that sit outside the income-tax brackets. */
export interface SelfEmploymentTax {
  /** 92.35% of net SE profit — the base the rates actually apply to. */
  netEarnings: number;
  socialSecurity: number;
  medicare: number;
  total: number;
  /** Half the total, deductible above the line under IRC 164(f). */
  deductiblePortion: number;
}

export interface CreditBreakdown {
  /** Credit earned before the income phaseout. */
  gross: number;
  /** Amount lost to the MAGI phaseout. */
  phasedOut: number;
  /** Credit surviving the phaseout, before the income-tax ceiling. */
  available: number;
  /** Actually subtracted — a non-refundable credit cannot pass zero tax. */
  applied: number;
}

export interface ScenarioBreakdown {
  label: string;
  /** Charitable amount actually subtracted before tax in this scenario. */
  donationApplied: number;
  /** Adjusted gross income: every source, less the deductible half of SE tax. */
  agi: number;
  federalTaxableIncome: number;
  stateTaxableIncome: number;
  /** Taxable income taxed at ordinary rates (total less the gains on top). */
  ordinaryTaxableIncome: number;
  /** Taxable income taxed at preferential long-term gains rates. */
  gainsTaxableIncome: number;
  federal: ProgressiveResult;
  /** Tax on the long-term gains slice, stacked above ordinary income. */
  capitalGains: ProgressiveResult;
  state: ProgressiveResult;
  selfEmployment: SelfEmploymentTax;
  /** FICA withheld from W-2 wages — the employee share only. */
  ficaWithheld: number;
  additionalMedicare: number;
  netInvestmentIncomeTax: number;
  credits: CreditBreakdown;
  /** Federal income tax after credits, excluding SE/NIIT/Medicare surtaxes. */
  federalIncomeTax: number;
  /** Every federal tax added together. */
  totalFederalTax: number;
  totalTax: number;
  /** Total income minus total tax, before the donation leaves your hands. */
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
  income: IncomeSources;
  /** Business expenses, deducted from self-employment revenue only. */
  expenses: number;
  donation: number;
  filingStatus: FilingStatus;
  stateCode: string;
  deductionMode: DeductionMode;
  dependents: Dependents;
}
