import {
  federalBrackets,
  federalStandardDeduction,
  federalTax,
  getState,
} from "./taxData";
import type {
  Bracket,
  BracketSlice,
  BracketTarget,
  CalculatorInput,
  DeductionMode,
  FilingStatus,
  KhumsBreakdown,
  ProgressiveResult,
  ScenarioBreakdown,
  StateTaxEntry,
  TaxComparison,
} from "./types";

/** Khums is one fifth of the net surplus remaining after the year's expenses. */
export const KHUMS_RATE = 0.2;

const EMPTY_RESULT: ProgressiveResult = {
  tax: 0,
  slices: [],
  effectiveRate: 0,
  marginalRate: 0,
};

const clampToZero = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/**
 * Walks a progressive schedule chunk by chunk, taxing only the slice of income
 * that falls inside each bracket. Returns the per-bracket audit trail alongside
 * the total so the UI can show its work.
 *
 * Expects normalized half-open brackets from `normalizeBrackets` — raw IRS-table
 * brackets would leak a dollar at every boundary.
 */
export function calculateProgressiveTax(
  taxableIncome: number,
  brackets: Bracket[],
): ProgressiveResult {
  const income = clampToZero(taxableIncome);
  if (!brackets.length) return EMPTY_RESULT;

  const slices: BracketSlice[] = [];
  let tax = 0;

  for (const bracket of brackets) {
    if (income <= bracket.min) break;

    const ceiling = bracket.max ?? Infinity;
    const amountInBracket = Math.min(income, ceiling) - bracket.min;
    if (amountInBracket <= 0) continue;

    const bracketTax = amountInBracket * bracket.rate;
    tax += bracketTax;
    slices.push({
      rate: bracket.rate,
      min: bracket.min,
      max: bracket.max,
      amountInBracket,
      tax: bracketTax,
    });
  }

  const topSlice = slices[slices.length - 1];
  return {
    tax,
    slices,
    effectiveRate: income > 0 ? tax / income : 0,
    marginalRate: topSlice?.rate ?? brackets[0].rate,
  };
}

/** Federal ordinary income tax for a filing status, from `data/federal_tax.json`. */
export function calculateFederalTax(
  taxableIncome: number,
  status: FilingStatus,
): ProgressiveResult {
  return calculateProgressiveTax(taxableIncome, federalBrackets(status));
}

/**
 * State income tax, dispatched on the state's `tax_type`:
 * `none` → $0, `flat` → single-rate, `graduated` → progressive loop.
 *
 * The 2026 dataset carries single-filer schedules only, so filing status does
 * not enter the state calculation.
 */
export function calculateStateTax(
  taxableIncome: number,
  state: StateTaxEntry,
): ProgressiveResult {
  switch (state.tax_type) {
    case "none":
      return EMPTY_RESULT;

    case "flat": {
      const rate = state.rate ?? 0;
      // Modelled as a one-bracket schedule so flat and graduated states share
      // the same result shape and the same breakdown UI.
      return calculateProgressiveTax(taxableIncome, [{ rate, min: 0, max: null }]);
    }

    case "graduated":
      return calculateProgressiveTax(taxableIncome, state.brackets);

    default:
      return EMPTY_RESULT;
  }
}

/** Net profit / net savings — the pool both the tax and the khums sit on top of. */
export function calculateNetProfit(totalIncome: number, expenses: number): number {
  return clampToZero(clampToZero(totalIncome) - clampToZero(expenses));
}

/** 1/5 of net profit, and how far the donation goes toward covering it. */
export function calculateKhums(netProfit: number, donation: number): KhumsBreakdown {
  const obligation = clampToZero(netProfit) * KHUMS_RATE;
  const given = clampToZero(donation);
  const fulfilled = Math.min(given, obligation);

  return {
    obligation,
    fulfilled,
    remaining: Math.max(0, obligation - given),
    surplus: Math.max(0, given - obligation),
    coverage: obligation > 0 ? Math.min(1, given / obligation) : given > 0 ? 1 : 0,
  };
}

/**
 * The deduction actually taken, given how the charitable gift stacks against
 * the standard deduction.
 *
 * `stacked`  — standard deduction *plus* the gift (the model the brief specifies).
 * `itemized` — the IRS rule: the greater of the standard deduction or the
 *              itemized total, which here is the charitable gift alone.
 */
function totalDeduction(
  standardDeduction: number,
  donation: number,
  mode: DeductionMode,
): number {
  return mode === "stacked"
    ? standardDeduction + donation
    : Math.max(standardDeduction, donation);
}

/**
 * How much more to give, from what's already entered, to drop federal taxable
 * income down to the floor of the bracket it currently sits in — the point
 * past which further giving still saves tax, just at the next lower rate.
 *
 * Federal only: state schedules have their own, unrelated breakpoints.
 */
export function calculateBracketTarget(
  netProfit: number,
  donation: number,
  status: FilingStatus,
  mode: DeductionMode,
): BracketTarget | null {
  const brackets = federalBrackets(status);
  const standardDeduction = federalStandardDeduction(status);
  const givenDonation = clampToZero(donation);
  const taxableIncome = clampToZero(
    netProfit - totalDeduction(standardDeduction, givenDonation, mode),
  );

  let bracketIndex = 0;
  brackets.forEach((bracket, index) => {
    if (taxableIncome > bracket.min) bracketIndex = index;
  });
  if (bracketIndex === 0) return null; // already in the lowest bracket

  const currentBracket = brackets[bracketIndex];
  const targetBracket = brackets[bracketIndex - 1];
  const bracketFloor = currentBracket.min;

  // Total donation (not just the increment) that lands taxable income right
  // at the current bracket's floor.
  const targetDonation =
    mode === "stacked"
      ? netProfit - bracketFloor - standardDeduction
      : netProfit - bracketFloor;

  const additionalDonationNeeded = clampToZero(targetDonation - givenDonation);
  if (additionalDonationNeeded <= 0) return null;

  return {
    currentRate: currentBracket.rate,
    targetRate: targetBracket.rate,
    targetDonation,
    additionalDonationNeeded,
  };
}

function buildScenario(
  label: string,
  netProfit: number,
  donation: number,
  status: FilingStatus,
  state: StateTaxEntry,
  mode: DeductionMode,
): ScenarioBreakdown {
  const federalTaxableIncome = clampToZero(
    netProfit - totalDeduction(federalStandardDeduction(status), donation, mode),
  );

  // The 2026 state dataset carries no standard deductions or exemptions, so the
  // only subtraction available at state level is the gift itself — and only in
  // states that allow a charitable deduction at all.
  const stateDonation = state.allowsCharitableDeduction ? donation : 0;
  const stateTaxableIncome = clampToZero(netProfit - stateDonation);

  const federal = calculateFederalTax(federalTaxableIncome, status);
  const stateResult = calculateStateTax(stateTaxableIncome, state);
  const totalTax = federal.tax + stateResult.tax;
  const afterTaxIncome = netProfit - totalTax;

  return {
    label,
    donationApplied: donation,
    federalTaxableIncome,
    stateTaxableIncome,
    federal,
    state: stateResult,
    totalTax,
    afterTaxIncome,
    retainedAfterGiving: afterTaxIncome - donation,
  };
}

/**
 * The whole engine in one call: net profit, khums, both scenarios, and the
 * optimization metrics that compare them. Pure — safe to run on every keystroke.
 */
export function buildComparison(input: CalculatorInput): TaxComparison {
  const { totalIncome, expenses, filingStatus, stateCode, deductionMode } = input;

  const state = getState(stateCode);
  const netProfit = calculateNetProfit(totalIncome, expenses);
  const donationEntered = clampToZero(input.donation);

  // IRC 170(b)(1)(A): cash gifts to public charities are deductible only up to
  // 60% of AGI. Anything above that carries forward for up to five years.
  const agiLimitAmount =
    netProfit * federalTax.charitable_deduction_limits.cash_public_charity_agi_limit;
  const deductibleDonation = Math.min(donationEntered, agiLimitAmount);

  const scenarioA = buildScenario(
    "Without donation",
    netProfit,
    0,
    filingStatus,
    state,
    deductionMode,
  );
  const scenarioB = buildScenario(
    "With donation",
    netProfit,
    deductibleDonation,
    filingStatus,
    state,
    deductionMode,
  );

  // Scenario B keeps the *entered* donation out of pocket even though only the
  // deductible slice reduces tax, so restate what the giver actually retains.
  scenarioB.retainedAfterGiving = scenarioB.afterTaxIncome - donationEntered;

  const taxSavings = scenarioA.totalTax - scenarioB.totalTax;

  return {
    netProfit,
    donationEntered,
    deductibleDonation,
    donationCarryforward: donationEntered - deductibleDonation,
    agiLimitAmount,
    khums: calculateKhums(netProfit, donationEntered),
    bracketTarget: calculateBracketTarget(
      netProfit,
      donationEntered,
      filingStatus,
      deductionMode,
    ),
    scenarioA,
    scenarioB,
    taxSavings,
    netCostOfGiving: donationEntered - taxSavings,
    givingDiscount: donationEntered > 0 ? taxSavings / donationEntered : 0,
    stateAllowsCharitableDeduction: state.allowsCharitableDeduction,
    stateEntry: state,
  };
}
