"use client";

import { Banknote, Receipt, Wallet } from "lucide-react";
import { MoneyField } from "@/components/wizard/money-field";
import { Readout } from "@/components/wizard/readout";
import { StepCard, StepNav } from "@/components/wizard/step-card";
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
      eyebrow="Step 2 of 5"
      title="What did you earn this year?"
      footer={
        <StepNav
          onBack={onBack}
          onNext={onNext}
          nextLabel="Calculate my tax"
          nextDisabled={netProfit <= 0}
        />
      }
    >
      <MoneyField
        label="Annual income or gross revenue"
        icon={<Banknote />}
        value={incomeText}
        onChange={onIncomeChange}
      />

      <MoneyField
        label="Annual deductible expenses"
        icon={<Receipt />}
        value={expensesText}
        onChange={onExpensesChange}
      />

      <Readout
        label="Net profit"
        value={formatCurrency(netProfit)}
        tone={netProfit > 0 ? "keep" : "default"}
      />
    </StepCard>
  );
}
