import { describe, expect, it, vi } from "vitest";
import { buildComparison, quickEstimateToCalculatorInput } from "./tax";
import type { FederalTaxData } from "./types";

/**
 * The Excel benchmark for a high-earning itemizer paying khums. It applies the
 * 2026 rules (0.5% floor, 35% cap) to a single-filer schedule whose 37% bracket
 * begins at $515,435 — not an IRS figure (2025: $626,350; 2026: $640,600) — so
 * that schedule is swapped in here to reproduce the spreadsheet's arithmetic.
 */
vi.mock("@/data/federal_tax_2026.json", async (importOriginal) => {
  const actual = (await importOriginal<{ default: FederalTaxData }>()).default;
  const data = structuredClone(actual);
  data.ordinary_income_tax.filing_statuses.single.brackets = [
    { rate: 0.1, min: 0, max: 11925 },
    { rate: 0.12, min: 11926, max: 48475 },
    { rate: 0.22, min: 48476, max: 103350 },
    { rate: 0.24, min: 103351, max: 197300 },
    { rate: 0.32, min: 197301, max: 250525 },
    { rate: 0.35, min: 250526, max: 515435 },
    { rate: 0.37, min: 515436, max: null },
  ];
  return { default: data };
});

const dollars = (n: number) => Math.round(n);

describe("khums benchmark: $676,418 AGI, $56,418 itemized, $100,000 gift", () => {
  const result = buildComparison(
    quickEstimateToCalculatorInput(
      {
        agi: 676_418,
        itemizedExpenses: 56_418,
        donationAmount: 100_000,
        charityType: "public",
        propertyType: "cash",
      },
      "single",
      "TX",
      2026,
    ),
  );
  const { scenarioA, scenarioB } = result;

  it("takes the 0.5% floor off the gift", () => {
    expect(dollars(result.charitableFloorAmount)).toBe(3_382);
    expect(dollars(result.deductibleDonation)).toBe(96_618);
  });

  it("taxes the brackets as the spreadsheet does", () => {
    // Bracket tax before the cap: on $620,000 without the gift, $523,382 with it.
    expect(dollars(scenarioA.totalTax - scenarioA.deductionCapClawback)).toBe(188_639);
    expect(dollars(scenarioB.totalTax - scenarioB.deductionCapClawback)).toBe(152_890);
  });

  it("costs the gift 2% of its deductible part through the 35% cap", () => {
    expect(dollars(result.deductionCapCost)).toBe(1_932);
  });

  it("matches the spreadsheet's savings and out-of-pocket cost", () => {
    expect(dollars(result.taxSavings)).toBe(33_816);
    expect(result.taxSavings).toBeCloseTo(result.deductibleDonation * 0.35, 6);
    expect(dollars(result.netCostOfGiving)).toBe(66_184);
  });

  it("also caps the deductions already itemized, which the spreadsheet does not", () => {
    // The statute reaches every itemized deduction, so both totals sit 2% of
    // $56,418 above the spreadsheet's; their difference — the savings — does not move.
    expect(dollars(scenarioA.deductionCapClawback)).toBe(1_128);
    expect(dollars(scenarioB.totalTax - scenarioA.deductionCapClawback)).toBe(154_822);
  });
});
