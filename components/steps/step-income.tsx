"use client";

import { useState } from "react";
import { Disclosure } from "@/components/ui-extras/disclosure";
import { MoneyField } from "@/components/wizard/money-field";
import { Note } from "@/components/wizard/note";
import { Readout } from "@/components/wizard/readout";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { formatCurrency, parseMoney } from "@/lib/format";

/** The text-state twin of `IncomeSources`, so fields format as you type. */
export interface IncomeText {
  wages: string;
  selfEmployment: string;
  retirementDistributions: string;
  unemployment: string;
  otherOrdinaryIncome: string;
  rentalRoyalty: string;
  otherInvestmentIncome: string;
  longTermCapitalGains: string;
  socialSecurityBenefits: string;
  taxExemptInterest: string;
}

/**
 * Everything except wages and 1099 revenue lives behind one disclosure, so the
 * step opens with two fields rather than ten. Its header carries a running
 * total, so nothing entered inside stays hidden.
 */
const OTHER_FIELDS: { key: keyof IncomeText; label: string }[] = [
  { key: "longTermCapitalGains", label: "Long-term gains & qualified dividends" },
  { key: "otherInvestmentIncome", label: "Interest, dividends & short-term gains" },
  { key: "rentalRoyalty", label: "Rental & royalty income" },
  { key: "taxExemptInterest", label: "Tax-exempt interest" },
  { key: "retirementDistributions", label: "IRA, 401(k) & pension withdrawals" },
  { key: "socialSecurityBenefits", label: "Social Security benefits" },
  { key: "unemployment", label: "Unemployment" },
  { key: "otherOrdinaryIncome", label: "Anything else — alimony, prizes…" },
];

export function StepIncome({
  incomeText,
  expensesText,
  netProfit,
  onIncomeChange,
  onExpensesChange,
  onBack,
  onNext,
}: {
  incomeText: IncomeText;
  expensesText: string;
  netProfit: number;
  onIncomeChange: (income: IncomeText) => void;
  onExpensesChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const set = (key: keyof IncomeText) => (value: string) =>
    onIncomeChange({ ...incomeText, [key]: value });

  const selfEmployment = parseMoney(incomeText.selfEmployment);
  const businessLoss = parseMoney(expensesText) > selfEmployment;

  const otherTotal = OTHER_FIELDS.reduce(
    (sum, field) => sum + parseMoney(incomeText[field.key]),
    0,
  );
  // Read once: tying `open` to the live total would snap the panel shut the
  // moment its last field is cleared.
  const [otherOpen] = useState(() => otherTotal > 0);

  return (
    <StepCard
      title="What did you earn?"
      subtitle="Yearly amounts, before tax."
      footer={
        <StepNav
          onBack={onBack}
          onNext={onNext}
          // The disabled button says why, so no separate warning is needed.
          nextLabel={netProfit > 0 ? "See my tax" : "Enter your income"}
          nextDisabled={netProfit <= 0}
        />
      }
    >
      <div className="space-y-5">
        <MoneyField
          label="Salary (W-2)"
          value={incomeText.wages}
          onChange={set("wages")}
        />

        <MoneyField
          label="Self-employment (1099)"
          value={incomeText.selfEmployment}
          onChange={set("selfEmployment")}
        />

        {selfEmployment > 0 ? (
          <MoneyField
            label="Business expenses"
            value={expensesText}
            onChange={onExpensesChange}
          />
        ) : null}

        <Disclosure
          title="Other income"
          aside={otherTotal > 0 ? <span className="tnum">{formatCurrency(otherTotal)}</span> : null}
          defaultOpen={otherOpen}
        >
          <div className="space-y-4">
            {OTHER_FIELDS.map((field) => (
              <MoneyField
                key={field.key}
                label={field.label}
                value={incomeText[field.key]}
                onChange={set(field.key)}
                size="md"
              />
            ))}
          </div>
        </Disclosure>
      </div>

      <Readout
        label="Total income"
        value={formatCurrency(netProfit)}
        tone={netProfit > 0 ? "keep" : "default"}
      />

      {businessLoss ? (
        <Note>
          Expenses exceed your business revenue, so the business adds nothing
          here. The loss is not set against your other income.
        </Note>
      ) : null}
    </StepCard>
  );
}
