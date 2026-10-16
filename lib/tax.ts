import {
  capitalGainsBrackets,
  federalBrackets,
  federalStandardDeduction,
  getFederalTax,
  getState,
  stateTaxYear,
} from "./taxData";
import type {
  Bracket,
  BracketSlice,
  BracketTarget,
  CalculatorInput,
  CharitableLimit,
  CharityType,
  CreditBreakdown,
  DeductionMode,
  Dependents,
  FilingStatus,
  IncomeSources,
  KhumsBreakdown,
  PhaseoutPoint,
  ProgressiveResult,
  PropertyType,
  QuickEstimateInput,
  ScenarioBreakdown,
  SelfEmploymentTax,
  SocialSecurityTaxability,
  StateTaxEntry,
  TaxComparison,
  TaxYear,
} from "./types";

/** Khums is one fifth of the net surplus remaining after the year's expenses. */
export const KHUMS_RATE = 0.2;

/**
 * AGI ceilings under IRC 170(b) for gifts that are not cash to a public charity.
 * Public cash (60%) lives in the data file; these are fixed by statute.
 */
const CHARITABLE_AGI_LIMITS = {
  public: { appreciated_property: 0.3 },
  private: { cash: 0.3, appreciated_property: 0.2 },
} as const;

/** Share of AGI that a gift to this kind of charity, of this kind of asset, may deduct. */
export function charitableAgiRate(
  taxYear: TaxYear,
  charityType: CharityType = "public",
  propertyType: PropertyType = "cash",
): number {
  if (charityType === "public") {
    return propertyType === "cash"
      ? getFederalTax(taxYear).charitable_deduction_limits.cash_public_charity_agi_limit
      : CHARITABLE_AGI_LIMITS.public.appreciated_property;
  }
  return CHARITABLE_AGI_LIMITS.private[propertyType];
}

/**
 * Caps a gift at its AGI ceiling and reports what is left over.
 *
 *   public  — 60% cash, 30% long-term appreciated property
 *   private — 30% cash, 20% long-term appreciated property
 *
 * Excess is not lost: it carries forward up to five years.
 */
export function calculateCharitableLimit(
  donation: number,
  agi: number,
  taxYear: TaxYear,
  charityType: CharityType = "public",
  propertyType: PropertyType = "cash",
): CharitableLimit {
  const rate = charitableAgiRate(taxYear, charityType, propertyType);
  const ceiling = clampToZero(agi) * rate;
  const given = clampToZero(donation);
  const deductible = Math.min(given, ceiling);

  return { rate, ceiling, deductible, carryforward: given - deductible };
}

/**
 * Quick Estimate answers as engine input: the one AGI figure enters as ordinary
 * income, so the engine's AGI equals it. "Itemized" is the real IRS rule — the
 * gift only helps once itemizing beats the standard deduction — and is when the
 * charitable floor and the 35% cap (both from 2026) apply.
 */
export function quickEstimateToCalculatorInput(
  quick: QuickEstimateInput,
  filingStatus: FilingStatus,
  stateCode: string,
  taxYear: TaxYear,
): CalculatorInput {
  return {
    taxYear,
    income: {
      wages: 0,
      selfEmployment: 0,
      retirementDistributions: 0,
      unemployment: 0,
      otherOrdinaryIncome: quick.agi,
      rentalRoyalty: 0,
      otherInvestmentIncome: 0,
      longTermCapitalGains: 0,
      socialSecurityBenefits: 0,
      taxExemptInterest: 0,
    },
    expenses: 0,
    donation: quick.donationAmount,
    filingStatus,
    stateCode,
    deductionMode: "itemized",
    dependents: { qualifyingChildren: 0, otherDependents: 0 },
    applyCharitableFloor: true,
    charityType: quick.charityType,
    propertyType: quick.propertyType,
    otherItemizedDeductions: quick.itemizedExpenses,
  };
}

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

/** Federal ordinary income tax for a filing status, from `data/federal_tax_<year>.json`. */
export function calculateFederalTax(
  taxableIncome: number,
  status: FilingStatus,
  taxYear: TaxYear,
): ProgressiveResult {
  return calculateProgressiveTax(taxableIncome, federalBrackets(status, taxYear));
}

/**
 * State income tax, dispatched on the state's `tax_type`:
 * `none` → $0, `flat` → single-rate, `graduated` → progressive loop.
 *
 * The state datasets carry single-filer schedules only, so filing status does
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

/**
 * What a phased-out amount comes to at this AGI: the base below the first
 * point, interpolated between points, and the last point's amount (zero, or a
 * floor) beyond. No points means the amount never phases out.
 */
export function phasedAmount(base: number, points: PhaseoutPoint[], agi: number): number {
  if (points.length === 0 || agi <= points[0].agi) return base;

  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    if (agi <= to.agi) {
      const share = (agi - from.agi) / (to.agi - from.agi);
      return from.amount + (to.amount - from.amount) * share;
    }
  }
  return points[points.length - 1].amount;
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
  taxYear: TaxYear,
): SelfEmploymentTax {
  const config = getFederalTax(taxYear).self_employment_tax;
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
export function calculateFicaWithheld(wages: number, taxYear: TaxYear): number {
  const federal = getFederalTax(taxYear);
  const config = federal.fica_employee;
  const base = federal.self_employment_tax.social_security_wage_base;
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
  taxYear: TaxYear,
): number {
  const config = getFederalTax(taxYear).additional_medicare_tax;
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
  taxYear: TaxYear,
): number {
  const config = getFederalTax(taxYear).net_investment_income_tax;
  const overage = clampToZero(clampToZero(magi) - config.magi_thresholds[status]);
  return Math.min(clampToZero(investmentIncome), overage) * config.rate;
}

/**
 * How much of a year's Social Security lands in taxable income (IRC 86).
 *
 * Benefits are not taxed on their own merits but on "provisional income" —
 * everything else you earned, plus municipal-bond interest that is otherwise
 * tax-free, plus half the benefits. Below the base amount nothing is taxable;
 * past the adjusted base the taxable share climbs toward 85% but never past it.
 */
export function calculateSocialSecurityTaxability(
  benefits: number,
  otherIncome: number,
  taxExemptInterest: number,
  status: FilingStatus,
  taxYear: TaxYear,
): SocialSecurityTaxability {
  const config = getFederalTax(taxYear).social_security_benefits;
  const received = clampToZero(benefits);

  const provisionalIncome =
    clampToZero(otherIncome) + clampToZero(taxExemptInterest) + received / 2;

  if (received <= 0) {
    return { benefits: 0, provisionalIncome, taxable: 0, taxableShare: 0 };
  }

  const base = config.base_amounts[status];
  const adjustedBase = config.adjusted_base_amounts[status];

  let taxable: number;
  if (provisionalIncome <= base) {
    taxable = 0;
  } else if (provisionalIncome <= adjustedBase) {
    // First tier: half the overage, capped at half the benefits.
    taxable = Math.min(
      (provisionalIncome - base) * config.lower_tier_rate,
      received * config.lower_tier_rate,
    );
  } else {
    // Second tier stacks on the first, and 85% is the hard ceiling.
    const carried = Math.min(
      config.adjustment_amounts[status],
      received * config.lower_tier_rate,
    );
    taxable = Math.min(
      (provisionalIncome - adjustedBase) * config.upper_tier_rate + carried,
      received * config.upper_tier_rate,
    );
  }

  return {
    benefits: received,
    provisionalIncome,
    taxable,
    taxableShare: received > 0 ? taxable / received : 0,
  };
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
  taxYear: TaxYear,
): CreditBreakdown {
  const config = getFederalTax(taxYear).child_tax_credit;
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
 * Every dollar that actually arrived, after business expenses — including the
 * parts the IRS never taxes. Khums is owed on real surplus, not on taxable
 * income, so municipal interest and untaxed benefits belong here even though
 * they never reach AGI.
 */
export function calculateNetProfit(
  income: IncomeSources,
  expenses: number,
): number {
  return (
    clampToZero(income.wages) +
    calculateSelfEmploymentProfit(income, expenses) +
    clampToZero(income.retirementDistributions) +
    clampToZero(income.unemployment) +
    clampToZero(income.otherOrdinaryIncome) +
    clampToZero(income.rentalRoyalty) +
    clampToZero(income.otherInvestmentIncome) +
    clampToZero(income.longTermCapitalGains) +
    clampToZero(income.socialSecurityBenefits) +
    clampToZero(income.taxExemptInterest)
  );
}

/**
 * Income taxed at ordinary rates *before* Social Security is folded in — the
 * "everything else" side of the provisional-income test.
 */
function ordinaryIncomeExcludingBenefits(
  income: IncomeSources,
  expenses: number,
): number {
  return (
    clampToZero(income.wages) +
    calculateSelfEmploymentProfit(income, expenses) +
    clampToZero(income.retirementDistributions) +
    clampToZero(income.unemployment) +
    clampToZero(income.otherOrdinaryIncome) +
    clampToZero(income.rentalRoyalty) +
    clampToZero(income.otherInvestmentIncome)
  );
}

/**
 * The NIIT base: passive and portfolio income only. Wages, self-employment
 * profit, retirement distributions and Social Security are all excluded by
 * IRC 1411(c), so they never land here.
 */
function netInvestmentIncome(income: IncomeSources): number {
  return (
    clampToZero(income.longTermCapitalGains) +
    clampToZero(income.otherInvestmentIncome) +
    clampToZero(income.rentalRoyalty)
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
  otherItemized = 0,
): number {
  return mode === "stacked"
    ? standardDeduction + donation
    : Math.max(standardDeduction, clampToZero(otherItemized) + donation);
}

/**
 * The 35% cap's terms for this return: the share of itemized deductions it
 * removes (2/37), and the income above the 37% bracket it is measured against.
 * The statute takes taxable income before the cut with the itemized deductions
 * added back — with no deduction between AGI and the itemized ones here, that
 * is AGI. A zero share in years without the cap.
 */
function itemizedLimitTerms(
  agi: number,
  status: FilingStatus,
  taxYear: TaxYear,
): { rate: number; exposedIncome: number } {
  const cap = getFederalTax(taxYear).itemized_deduction_limit.benefit_rate_cap;
  const brackets = federalBrackets(status, taxYear);
  const top = brackets[brackets.length - 1];
  if (cap === null || !top || top.rate <= cap) return { rate: 0, exposedIncome: 0 };

  return {
    rate: (top.rate - cap) / top.rate,
    exposedIncome: clampToZero(clampToZero(agi) - top.min),
  };
}

/**
 * Itemized deductions lost to the 35% cap — IRC 68 as OBBBA rewrote it, from
 * 2026. They shrink by 2/37 of the lesser of the deductions themselves or the
 * income above where the 37% bracket begins, so a dollar deducted against 37%
 * income saves 35¢. It reaches every itemized deduction, not just the gift,
 * and runs last — after the gift's ceiling and floor.
 */
export function calculateItemizedDeductionLimit(
  itemizedDeductions: number,
  agi: number,
  status: FilingStatus,
  taxYear: TaxYear,
): number {
  const { rate, exposedIncome } = itemizedLimitTerms(agi, status, taxYear);
  return rate * Math.min(clampToZero(itemizedDeductions), exposedIncome);
}

/**
 * The cap run backwards: the itemized total that still leaves `allowed` once
 * the cap has taken its share. Up to the exposed income each dollar keeps
 * 35/37 of itself; past it the cut is fixed, so further dollars count in full.
 */
function itemizedBeforeLimit(
  allowed: number,
  agi: number,
  status: FilingStatus,
  taxYear: TaxYear,
): number {
  const { rate, exposedIncome } = itemizedLimitTerms(agi, status, taxYear);
  return allowed <= (1 - rate) * exposedIncome
    ? allowed / (1 - rate)
    : allowed + rate * exposedIncome;
}

/**
 * The federal deduction, and how much of an itemized total the 35% cap took
 * from it. Only an itemizing return is cut; one cut below the standard
 * deduction just takes the standard deduction instead.
 */
function calculateFederalDeduction(
  input: CalculatorInput,
  donation: number,
  agi: number,
): { deduction: number; itemizedReduction: number } {
  const { taxYear, filingStatus, deductionMode, otherItemizedDeductions = 0 } = input;
  const standardDeduction = federalStandardDeduction(filingStatus, taxYear);
  const uncapped = totalDeduction(
    standardDeduction,
    donation,
    deductionMode,
    otherItemizedDeductions,
  );
  if (deductionMode !== "itemized") return { deduction: uncapped, itemizedReduction: 0 };

  const itemized = clampToZero(otherItemizedDeductions) + donation;
  const deduction = Math.max(
    standardDeduction,
    itemized - calculateItemizedDeductionLimit(itemized, agi, filingStatus, taxYear),
  );
  return { deduction, itemizedReduction: uncapped - deduction };
}

/**
 * Federal income tax before credits on one taxable income. Gains sit on top:
 * deductions eat ordinary income first, and whatever gains survive are taxed
 * at preferential rates from the ordinary income upward.
 */
function calculateIncomeTax(
  taxableIncome: number,
  gains: number,
  status: FilingStatus,
  taxYear: TaxYear,
) {
  const gainsTaxableIncome = Math.min(gains, taxableIncome);
  const ordinaryTaxableIncome = taxableIncome - gainsTaxableIncome;
  const federal = calculateFederalTax(ordinaryTaxableIncome, status, taxYear);
  const capitalGains = calculateStackedTax(
    gainsTaxableIncome,
    ordinaryTaxableIncome,
    capitalGainsBrackets(status, taxYear),
  );

  return {
    gainsTaxableIncome,
    ordinaryTaxableIncome,
    federal,
    capitalGains,
    tax: federal.tax + capitalGains.tax,
  };
}

/**
 * AGI, and the Social Security figure it depends on. Independent of the
 * charitable gift — that comes off below the line — so both scenarios and the
 * bracket-target solver can share one computation.
 *
 * Note what is *absent*: municipal interest never enters AGI, and only the
 * taxable slice of Social Security does.
 */
function calculateAgiParts(
  income: IncomeSources,
  expenses: number,
  status: FilingStatus,
  taxYear: TaxYear,
): { agi: number; socialSecurity: SocialSecurityTaxability } {
  const seProfit = calculateSelfEmploymentProfit(income, expenses);
  const seTax = calculateSelfEmploymentTax(seProfit, clampToZero(income.wages), taxYear);

  const ordinaryBeforeBenefits = ordinaryIncomeExcludingBenefits(income, expenses);
  const gains = clampToZero(income.longTermCapitalGains);

  const socialSecurity = calculateSocialSecurityTaxability(
    income.socialSecurityBenefits,
    ordinaryBeforeBenefits + gains - seTax.deductiblePortion,
    income.taxExemptInterest,
    status,
    taxYear,
  );

  const agi = clampToZero(
    ordinaryBeforeBenefits +
      gains +
      socialSecurity.taxable -
      seTax.deductiblePortion,
  );

  return { agi, socialSecurity };
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
  const { taxYear, income, expenses, filingStatus, deductionMode } = input;

  const brackets = federalBrackets(filingStatus, taxYear);
  const standardDeduction = federalStandardDeduction(filingStatus, taxYear);
  const givenDonation = clampToZero(donation);

  const { agi } = calculateAgiParts(income, expenses, filingStatus, taxYear);
  const gains = clampToZero(income.longTermCapitalGains);

  const taxableIncome = clampToZero(
    agi - calculateFederalDeduction(input, givenDonation, agi).deduction,
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
  // An itemized total must also cover what the 35% cap will take back from it.
  const deductionNeeded = agi - gains - currentBracket.min;
  const targetDonation =
    deductionMode === "stacked"
      ? deductionNeeded - standardDeduction
      : itemizedBeforeLimit(deductionNeeded, agi, filingStatus, taxYear) -
        clampToZero(input.otherItemizedDeductions ?? 0);

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
  const { taxYear, income, expenses, filingStatus, deductionMode, dependents } = input;

  const wages = clampToZero(income.wages);
  const gains = clampToZero(income.longTermCapitalGains);

  const seProfit = calculateSelfEmploymentProfit(income, expenses);
  const selfEmployment = calculateSelfEmploymentTax(seProfit, wages, taxYear);
  const ficaWithheld = calculateFicaWithheld(wages, taxYear);

  const grossIncome = calculateNetProfit(income, expenses);
  const { agi, socialSecurity } = calculateAgiParts(
    income,
    expenses,
    filingStatus,
    taxYear,
  );

  const { deduction: federalDeduction, itemizedReduction } = calculateFederalDeduction(
    input,
    donation,
    agi,
  );
  const federalTaxableIncome = clampToZero(agi - federalDeduction);
  const incomeTax = calculateIncomeTax(federalTaxableIncome, gains, filingStatus, taxYear);
  const { gainsTaxableIncome, ordinaryTaxableIncome, federal, capitalGains } = incomeTax;

  // What the cap costs this return: its tax against the tax had the whole
  // itemized total come off. Measured, not assumed to be 2% — where the
  // deductions straddle the 37% threshold, the income added back is taxed at 35%.
  const deductionCapClawback =
    itemizedReduction > 0
      ? incomeTax.tax -
        calculateIncomeTax(
          clampToZero(agi - federalDeduction - itemizedReduction),
          gains,
          filingStatus,
          taxYear,
        ).tax
      : 0;

  const incomeTaxBeforeCredits = incomeTax.tax;
  const credits = calculateChildTaxCredit(
    dependents,
    agi,
    filingStatus,
    incomeTaxBeforeCredits,
    taxYear,
  );
  const federalIncomeTax = clampToZero(incomeTaxBeforeCredits - credits.applied);

  const additionalMedicare = calculateAdditionalMedicare(
    wages + selfEmployment.netEarnings,
    filingStatus,
    taxYear,
  );
  const netInvestmentIncomeTax = calculateNetInvestmentIncomeTax(
    netInvestmentIncome(income),
    agi,
    filingStatus,
    taxYear,
  );

  const totalFederalTax =
    federalIncomeTax +
    selfEmployment.total +
    ficaWithheld +
    additionalMedicare +
    netInvestmentIncomeTax;

  // The state stacks its own standard deduction against the gift the same way
  // the federal return does. Where a state allows no charitable deduction it
  // has no itemized route either, so neither the gift nor the other itemized
  // deductions come off — the standard deduction alone does. The exemption is
  // a flat subtraction on top, taken however the filer deducts. Both shrink
  // with AGI in some states, and AGI does not move with the gift.
  const stateStandardDeduction = phasedAmount(
    state.standardDeduction,
    state.standardDeductionPhaseout,
    agi,
  );
  const statePersonalExemption = phasedAmount(
    state.personalExemption,
    state.personalExemptionPhaseout,
    agi,
  );
  const stateItemizes = state.allowsCharitableDeduction;
  const stateDeduction =
    totalDeduction(
      stateStandardDeduction,
      stateItemizes ? donation : 0,
      deductionMode,
      stateItemizes ? input.otherItemizedDeductions : 0,
    ) + statePersonalExemption;
  const stateTaxableIncome = clampToZero(agi - stateDeduction);
  const stateResult = calculateStateTax(stateTaxableIncome, state);

  const totalTax = totalFederalTax + stateResult.tax;
  const afterTaxIncome = grossIncome - totalTax;

  return {
    label,
    donationApplied: donation,
    agi,
    federalDeduction,
    itemizedDeductionReduction: itemizedReduction,
    deductionCapClawback,
    federalTaxableIncome,
    stateStandardDeduction,
    statePersonalExemption,
    stateDeduction,
    stateTaxableIncome,
    ordinaryTaxableIncome,
    gainsTaxableIncome,
    federal,
    capitalGains,
    state: stateResult,
    selfEmployment,
    socialSecurity,
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
  const { taxYear } = input;
  const state = getState(input.stateCode, taxYear);
  const netProfit = calculateNetProfit(input.income, input.expenses);
  const donationEntered = clampToZero(input.donation);

  // IRC 170(b): the ceiling depends on who gets the gift and what it is (60% /
  // 30% public, 30% / 20% private). Anything above carries forward five years.
  const limit = calculateCharitableLimit(
    donationEntered,
    netProfit,
    taxYear,
    input.charityType,
    input.propertyType,
  );
  const agiLimitAmount = limit.ceiling;
  const cappedDonation = limit.deductible;

  // The floor comes off the gift that survives the ceiling, so a gift smaller
  // than the floor (0.5% of AGI from 2026) deducts nothing. Off unless the
  // caller asks for it, and zero in years before it existed.
  const floorRate = input.applyCharitableFloor
    ? getFederalTax(taxYear).charitable_deduction_limits.agi_floor
    : 0;
  const floorAmount =
    floorRate > 0
      ? Math.min(
          cappedDonation,
          calculateAgiParts(input.income, input.expenses, input.filingStatus, taxYear)
            .agi * floorRate,
        )
      : 0;
  const deductibleDonation = cappedDonation - floorAmount;

  const scenarioA = buildScenario("Without donation", input, 0, state);
  const scenarioB = buildScenario("With donation", input, deductibleDonation, state);

  // Scenario B keeps the *entered* donation out of pocket even though only the
  // deductible slice reduces tax, so restate what the giver actually retains.
  scenarioB.retainedAfterGiving = scenarioB.afterTaxIncome - donationEntered;

  const taxSavings = scenarioA.totalTax - scenarioB.totalTax;

  return {
    taxYear,
    stateTaxYear: stateTaxYear(taxYear),
    federalStandardDeduction: federalStandardDeduction(input.filingStatus, taxYear),
    netProfit,
    donationEntered,
    deductibleDonation,
    donationCarryforward: limit.carryforward,
    charitableLimitRate: limit.rate,
    charitableFloorAmount: floorAmount,
    agiLimitAmount,
    khums: calculateKhums(netProfit, donationEntered),
    bracketTarget: calculateBracketTarget(input, donationEntered - floorAmount),
    scenarioA,
    scenarioB,
    taxSavings,
    deductionCapCost: scenarioB.deductionCapClawback - scenarioA.deductionCapClawback,
    netCostOfGiving: donationEntered - taxSavings,
    givingDiscount: donationEntered > 0 ? taxSavings / donationEntered : 0,
    stateAllowsCharitableDeduction: state.allowsCharitableDeduction,
    stateEntry: state,
  };
}
