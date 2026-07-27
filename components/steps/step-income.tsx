"use client";

import { Wallet } from "lucide-react";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { MoneyField } from "@/components/wizard/money-field";
import { Readout } from "@/components/wizard/readout";
import { formatCurrency } from "@/lib/format";

export function StepIncome({
  incomeText,
  expensesText,
  netProfit,
  onIncomeChange,
  onExpensesChange,
  onBack,
  onNext,
}: {
  incomeText: string;
  expensesText: string;
  netProfit: number;
  onIncomeChange: (value: string) => void;
  onExpensesChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <StepCard
      icon={<Wallet />}
      eyebrow="Step 2 of 4"
      title="What did you earn this year?"
      description="Gross income first, then the costs you can deduct against it. What's left is the net profit that both the tax and the khums are calculated on."
      footer={
        <StepNav
          onBack={onBack}
          onNext={onNext}
          nextLabel={netProfit > 0 ? "Continue" : "Continue anyway"}
        />
      }
    >
      <MoneyField
        label="Annual income or gross revenue"
        value={incomeText}
        onChange={onIncomeChange}
        placeholder="120,000"
        hint="Salary, business revenue, or both — before any deductions."
      />

      <MoneyField
        label="Annual deductible expenses"
        value={expensesText}
        onChange={onExpensesChange}
        placeholder="20,000"
        hint="Business or living costs you subtract before arriving at profit. Enter 0 if none apply."
      />

      <Readout
        label="Net profit for the year"
        value={formatCurrency(netProfit)}
        hint={
          netProfit > 0
            ? "Income minus expenses. Both the tax bill and the khums build on this."
            : "Expenses meet or exceed income, so there is nothing to tax and no khums this year."
        }
        tone={netProfit > 0 ? "keep" : "default"}
      />
    </StepCard>
  );
}
