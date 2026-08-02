import {
  capitalGainsBrackets,
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
  CreditBreakdown,
  DeductionMode,
  Dependents,
  FilingStatus,
  IncomeSources,
  KhumsBreakdown,
  ProgressiveResult,
  ScenarioBreakdown,
  SelfEmploymentTax,
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

const NO_SE_TAX: SelfEmploymentTax = {
  netEarnings: 0,
  socialSecurity: 0,
  medicare: 0,
  total: 0,
  deductiblePortion: 0,
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

/**
 * Taxes a band of income that sits *on top of* something else.
 *
 * Long-term gains do not get their own private schedule starting at zero: the
 * 0/15/20% thresholds are measured against total taxable income, so ordinary
 * income underneath pushes the gains up into higher gain brackets. `floor` is
 * that ordinary income; only the band above it is taxed here.
 */
export function calculateStackedTax(
  amount: number,
  floor: number,
  brackets: Bracket[],
): ProgressiveResult {
  const band = clampToZero(amount);
  const base = clampToZero(floor);
  if (band <= 0 || !brackets.length) return EMPTY_RESULT;

  const top = base + band;
  const slices: BracketSlice[] = [];
  let tax = 0;

  for (const bracket of brackets) {
    const ceiling = bracket.max ?? Infinity;
    const low = Math.max(bracket.min, base);
    const high = Math.min(ceiling, top);
    const amountInBracket = high - low;
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
    effectiveRate: band > 0 ? tax / band : 0,
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

// ------------------------------------------------------------ payroll taxes

/** Self-employment profit: 1099 / business revenue less the year's expenses. */
export function calculateSelfEmploymentProfit(
  income: IncomeSources,
  expenses: number,
): number {
  return clampToZero(clampToZero(income.selfEmployment) - clampToZero(expenses));
}

/**
 * SECA — the self-employed equivalent of both halves of FICA.
 *
 * `wages` matters because the Social Security cap is shared: W-2 wages fill it
 * first, and only what is left of the base is available to SE earnings.
 */
export function calculateSelfEmploymentTax(
  selfEmploymentProfit: number,
  wages: number,
): SelfEmploymentTax {
  const config = federalTax.self_employment_tax;
  const netEarnings = clampToZero(selfEmploymentProfit) * config.net_earnings_factor;
  if (netEarnings < config.minimum_net_earnings) return NO_SE_TAX;

  const baseLeft = clampToZero(
    config.social_security_wage_base - clampToZero(wages),
  );
  const socialSecurity = Math.min(netEarnings, baseLeft) * config.social_security_rate;
  const medicare = netEarnings * config.medicare_rate;
  const total = socialSecurity + medicare;

  return {
    netEarnings,
    socialSecurity,
    medicare,
    total,
    deductiblePortion: total / 2,
  };
}

/** The employee's own FICA on W-2 wages. The employer's match is not your cost. */
export function calculateFicaWithheld(wages: number): number {
  const config = federalTax.fica_employee;
  const base = federalTax.self_employment_tax.social_security_wage_base;
  const paid = clampToZero(wages);

  return (
    Math.min(paid, base) * config.social_security_rate +
    paid * config.medicare_rate
  );
}

/** 0.9% on wages plus SE earnings above a statutory, non-indexed threshold. */
export function calculateAdditionalMedicare(
  earnedIncome: number,
  status: FilingStatus,
): number {
  const config = federalTax.additional_medicare_tax;
  const excess = clampToZero(
    clampToZero(earnedIncome) - config.wage_thresholds[status],
  );
  return excess * config.rate;
}

/** 3.8% on the lesser of investment income or the MAGI overage. */
export function calculateNetInvestmentIncomeTax(
  investmentIncome: number,
  magi: number,
  status: FilingStatus,
): number {
  const config = federalTax.net_investment_income_tax;
  const overage = clampToZero(clampToZero(magi) - config.magi_thresholds[status]);
  return Math.min(clampToZero(investmentIncome), overage) * config.rate;
}

// ---------------------------------------------------------------- credits

/**
 * Child Tax Credit plus the Other Dependent Credit, phased out on MAGI.
 *
 * Modelled as non-refundable: it reduces tax to zero and stops. The refundable
 * Additional Child Tax Credit is deliberately not paid out here, so the figure
 * is never optimistic.
 */
export function calculateChildTaxCredit(
  dependents: Dependents,
  magi: number,
  status: FilingStatus,
  incomeTax: number,
): CreditBreakdown {
  const config = federalTax.child_tax_credit;
  const children = Math.max(0, Math.floor(dependents.qualifyingChildren));
  const others = Math.max(0, Math.floor(dependents.otherDependents));

  const gross =
    children * config.amount_per_child + others * config.other_dependent_credit;
  if (gross <= 0) return { gross: 0, phasedOut: 0, available: 0, applied: 0 };

  // "Each $1,000 or fraction thereof" — hence the ceiling rather than a ratio.
  const excess = clampToZero(clampToZero(magi) - config.magi_thresholds[status]);
  const steps = Math.ceil(excess / config.phaseout_step);
  const phasedOut = Math.min(gross, steps * config.phaseout_per);

  const available = gross - phasedOut;
  return {
    gross,
    phasedOut,
    available,
    applied: Math.min(available, clampToZero(incomeTax)),
  };
}

// ---------------------------------------------------------------- the engine

/**
 * Total income after business expenses — the pool the khums sits on and the
 * headline "what you made this year" figure.
 */
export function calculateNetProfit(
  income: IncomeSources,
  expenses: number,
): number {
  return (
    clampToZero(income.wages) +
    calculateSelfEmploymentProfit(income, expenses) +
    clampToZero(income.otherInvestmentIncome) +
    clampToZero(income.longTermCapitalGains)
  );
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

/** AGI is independent of the charitable gift, so it is computed once up front. */
function calculateAgi(
  income: IncomeSources,
  expenses: number,
  selfEmploymentTax: SelfEmploymentTax,
): number {
  return clampToZero(
    calculateNetProfit(income, expenses) - selfEmploymentTax.deductiblePortion,
  );
}

/**
 * How much more to give, from what's already entered, to drop the *ordinary*
 * taxable income down to the floor of the bracket it currently sits in.
 *
 * Federal ordinary rates only: state schedules have their own breakpoints, and
 * long-term gains ride their own 0/15/20% table.
 */
export function calculateBracketTarget(
  input: CalculatorInput,
  donation: number,
): BracketTarget | null {
  const { income, expenses, filingStatus, deductionMode } = input;

  const brackets = federalBrackets(filingStatus);
  const standardDeduction = federalStandardDeduction(filingStatus);
  const givenDonation = clampToZero(donation);

  const seProfit = calculateSelfEmploymentProfit(income, expenses);
  const seTax = calculateSelfEmploymentTax(seProfit, clampToZero(income.wages));
  const agi = calculateAgi(income, expenses, seTax);
  const gains = clampToZero(income.longTermCapitalGains);

  const taxableIncome = clampToZero(
    agi - totalDeduction(standardDeduction, givenDonation, deductionMode),
  );
  const ordinaryTaxable = clampToZero(taxableIncome - Math.min(gains, taxableIncome));

  let bracketIndex = 0;
  brackets.forEach((bracket, index) => {
    if (ordinaryTaxable > bracket.min) bracketIndex = index;
  });
  if (bracketIndex === 0) return null; // already in the lowest bracket

  const currentBracket = brackets[bracketIndex];
  const targetBracket = brackets[bracketIndex - 1];

  // Deductions come off ordinary income before they touch the gains stacked on
  // top, so the gift has to erase everything between the floor and AGI-less-gains.
  const deductionNeeded = agi - gains - currentBracket.min;
  const targetDonation =
    deductionMode === "stacked"
      ? deductionNeeded - standardDeduction
      : deductionNeeded;

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
  input: CalculatorInput,
  donation: number,
  state: StateTaxEntry,
): ScenarioBreakdown {
  const { income, expenses, filingStatus, deductionMode, dependents } = input;

  const wages = clampToZero(income.wages);
  const gains = clampToZero(income.longTermCapitalGains);
  const investment = clampToZero(income.otherInvestmentIncome);

  const seProfit = calculateSelfEmploymentProfit(income, expenses);
  const selfEmployment = calculateSelfEmploymentTax(seProfit, wages);
  const ficaWithheld = calculateFicaWithheld(wages);

  const grossIncome = calculateNetProfit(income, expenses);
  const agi = calculateAgi(income, expenses, selfEmployment);

  const federalTaxableIncome = clampToZero(
    agi - totalDeduction(federalStandardDeduction(filingStatus), donation, deductionMode),
  );

  // Gains sit on top: deductions eat ordinary income first, and whatever gains
  // survive are taxed at preferential rates from the ordinary income upward.
  const gainsTaxableIncome = Math.min(gains, federalTaxableIncome);
  const ordinaryTaxableIncome = federalTaxableIncome - gainsTaxableIncome;

  const federal = calculateFederalTax(ordinaryTaxableIncome, filingStatus);
  const capitalGains = calculateStackedTax(
    gainsTaxableIncome,
    ordinaryTaxableIncome,
    capitalGainsBrackets(filingStatus),
  );

  const incomeTaxBeforeCredits = federal.tax + capitalGains.tax;
  const credits = calculateChildTaxCredit(
    dependents,
    agi,
    filingStatus,
    incomeTaxBeforeCredits,
  );
  const federalIncomeTax = clampToZero(incomeTaxBeforeCredits - credits.applied);

  const additionalMedicare = calculateAdditionalMedicare(
    wages + selfEmployment.netEarnings,
    filingStatus,
  );
  const netInvestmentIncomeTax = calculateNetInvestmentIncomeTax(
    gains + investment,
    agi,
    filingStatus,
  );

  const totalFederalTax =
    federalIncomeTax +
    selfEmployment.total +
    ficaWithheld +
    additionalMedicare +
    netInvestmentIncomeTax;

  // The 2026 state dataset carries no standard deductions or exemptions, so the
  // only subtraction available at state level is the gift itself — and only in
  // states that allow a charitable deduction at all.
  const stateDonation = state.allowsCharitableDeduction ? donation : 0;
  const stateTaxableIncome = clampToZero(agi - stateDonation);
  const stateResult = calculateStateTax(stateTaxableIncome, state);

  const totalTax = totalFederalTax + stateResult.tax;
  const afterTaxIncome = grossIncome - totalTax;

  return {
    label,
    donationApplied: donation,
    agi,
    federalTaxableIncome,
    stateTaxableIncome,
    ordinaryTaxableIncome,
    gainsTaxableIncome,
    federal,
    capitalGains,
    state: stateResult,
    selfEmployment,
    ficaWithheld,
    additionalMedicare,
    netInvestmentIncomeTax,
    credits,
    federalIncomeTax,
    totalFederalTax,
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
  const state = getState(input.stateCode);
  const netProfit = calculateNetProfit(input.income, input.expenses);
  const donationEntered = clampToZero(input.donation);

  // IRC 170(b)(1)(A): cash gifts to public charities are deductible only up to
  // 60% of AGI. Anything above that carries forward for up to five years.
  const agiLimitAmount =
    netProfit * federalTax.charitable_deduction_limits.cash_public_charity_agi_limit;
  const deductibleDonation = Math.min(donationEntered, agiLimitAmount);

  const scenarioA = buildScenario("Without donation", input, 0, state);
  const scenarioB = buildScenario("With donation", input, deductibleDonation, state);

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
    bracketTarget: calculateBracketTarget(input, donationEntered),
    scenarioA,
    scenarioB,
    taxSavings,
    netCostOfGiving: donationEntered - taxSavings,
    givingDiscount: donationEntered > 0 ? taxSavings / donationEntered : 0,
    stateAllowsCharitableDeduction: state.allowsCharitableDeduction,
    stateEntry: state,
  };
}
