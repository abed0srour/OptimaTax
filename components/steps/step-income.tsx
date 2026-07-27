"use client";

import { Banknote, Receipt, TriangleAlert, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MoneyField } from "@/components/wizard/money-field";
import { Readout } from "@/components/wizard/readout";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";

export function StepIncome({
  incomeText,
  expensesText,
  netProfit,
  rawNetProfit,
  onIncomeChange,
  onExpensesChange,
  onBack,
  onNext,
}: {
  incomeText: string;
  expensesText: string;
  /** Floored at zero — what the tax engine actually works from. */
  netProfit: number;
  /** The true difference, which may be negative. Display only. */
  rawNetProfit: number;
  onIncomeChange: (value: string) => void;
  onExpensesChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const atLoss = rawNetProfit < 0;

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
        label={atLoss ? "Net loss" : "Net profit"}
        value={
          atLoss ? formatSignedCurrency(rawNetProfit) : formatCurrency(netProfit)
        }
        tone={atLoss ? "tax" : netProfit > 0 ? "keep" : "default"}
      />

      {atLoss ? (
        <Alert>
          <TriangleAlert className="text-tax" />
          <AlertTitle>Expenses exceed your income</AlertTitle>
          <AlertDescription>
            There is no profit to tax this year, so there is nothing to calculate.
            Lower your expenses or raise your income to continue.
          </AlertDescription>
        </Alert>
      ) : null}
    </StepCard>
  );
}
