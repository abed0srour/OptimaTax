import { describe, expect, it } from "vitest";
import {
  buildComparison,
  calculateItemizedDeductionLimit,
  quickEstimateToCalculatorInput,
} from "./tax";
import type { CalculatorInput, TaxYear } from "./types";

/** A Quick Estimate in Texas, so no state tax muddies the federal figures. */
function quick(
  taxYear: TaxYear,
  agi: number,
  itemizedExpenses: number,
  donationAmount: number,
): CalculatorInput {
  return quickEstimateToCalculatorInput(
    { agi, itemizedExpenses, donationAmount, charityType: "public", propertyType: "cash" },
    "single",
    "TX",
    taxYear,
  );
}

describe("35% cap on itemized deductions (IRC 68)", () => {
  it("trims 2/37 of the itemized deductions offsetting 37% income", () => {
    // 2026 single: the 37% bracket begins at $640,600.
    expect(calculateItemizedDeductionLimit(100_000, 700_000, "single", 2026)).toBeCloseTo(
      (2 / 37) * 59_400,
      6,
    );
    expect(calculateItemizedDeductionLimit(10_000, 700_000, "single", 2026)).toBeCloseTo(
      (2 / 37) * 10_000,
      6,
    );
    expect(calculateItemizedDeductionLimit(100_000, 600_000, "single", 2026)).toBe(0);
  });

  it("does not exist before 2026", () => {
    expect(calculateItemizedDeductionLimit(100_000, 900_000, "single", 2025)).toBe(0);
  });

  it("holds a top-bracket gift to 35¢ on the dollar, after the 0.5% floor", () => {
    const result = buildComparison(quick(2026, 900_000, 50_000, 100_000));

    expect(result.charitableFloorAmount).toBeCloseTo(4_500, 6);
    expect(result.deductibleDonation).toBeCloseTo(95_500, 6);

    // Every itemized dollar is capped, so the baseline pays too: 2% of $50,000.
    expect(result.scenarioA.deductionCapClawback).toBeCloseTo(1_000, 6);
    expect(result.scenarioB.deductionCapClawback).toBeCloseTo(2_910, 6);
    expect(result.deductionCapCost).toBeCloseTo(1_910, 6);

    expect(result.taxSavings).toBeCloseTo(95_500 * 0.35, 6);
    expect(result.netCostOfGiving).toBeCloseTo(100_000 - 95_500 * 0.35, 6);
  });

  it("leaves 2025 at the full 37% with no floor, even with the floor switched on", () => {
    const input = quick(2025, 900_000, 50_000, 100_000);
    expect(input.applyCharitableFloor).toBe(true);

    const result = buildComparison(input);
    expect(result.charitableFloorAmount).toBe(0);
    expect(result.scenarioB.itemizedDeductionReduction).toBe(0);
    expect(result.deductionCapCost).toBe(0);
    expect(result.taxSavings).toBeCloseTo(100_000 * 0.37, 6);
  });

  it("measures the clawback at 35% where the deductions straddle the 37% threshold", () => {
    // $96,500 deductible against $700,000: only $59,400 of it offsets 37% income,
    // and the $3,211 added back lands in the 35% bracket.
    const result = buildComparison(quick(2026, 700_000, 0, 100_000));
    const reduction = (2 / 37) * 59_400;

    expect(result.scenarioA.itemizedDeductionReduction).toBe(0); // standard deduction
    expect(result.scenarioB.itemizedDeductionReduction).toBeCloseTo(reduction, 6);
    expect(result.scenarioB.deductionCapClawback).toBeCloseTo(reduction * 0.35, 6);
    expect(result.deductionCapCost).toBeCloseTo(reduction * 0.35, 6);
  });

  it("never reaches a filer below the 37% bracket", () => {
    const result = buildComparison(quick(2026, 400_000, 30_000, 50_000));
    expect(result.scenarioA.deductionCapClawback).toBe(0);
    expect(result.scenarioB.deductionCapClawback).toBe(0);
    expect(result.taxSavings).toBeCloseTo((50_000 - 2_000) * 0.35, 6);
  });

  it("leaves the standard-plus-gift model alone", () => {
    const result = buildComparison({ ...quick(2026, 900_000, 0, 100_000), deductionMode: "stacked" });
    expect(result.scenarioB.itemizedDeductionReduction).toBe(0);
    expect(result.deductionCapCost).toBe(0);
  });

  it("aims the bracket target past what the cap will take back", () => {
    const input: CalculatorInput = {
      ...quick(2026, 700_000, 0, 10_000),
      applyCharitableFloor: false,
    };
    const target = buildComparison(input).bracketTarget;
    expect(target?.currentRate).toBe(0.37);
    // $59,400 must come off, plus the 2/37 of it the cap removes.
    expect(target?.targetDonation).toBeCloseTo(59_400 * (39 / 37), 6);

    const landed = buildComparison({ ...input, donation: target!.targetDonation });
    expect(landed.scenarioB.ordinaryTaxableIncome).toBeCloseTo(640_600, 6);
  });
});
