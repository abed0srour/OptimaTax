"use client";

import {
  Briefcase,
  Landmark,
  LineChart,
  PiggyBank,
  Receipt,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Disclosure } from "@/components/ui-extras/disclosure";
import { MoneyField } from "@/components/wizard/money-field";
import { Readout } from "@/components/wizard/readout";
import { StepCard, StepNav } from "@/components/wizard/step-card";
import { formatCurrency, parseMoney } from "@/lib/format";

/** The text-state twin of `IncomeSources`, so fields format as you type. */
export interface IncomeText {
  wages: string;
  selfEmployment: string;
  longTermCapitalGains: string;
  otherInvestmentIncome: string;
}

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
  const expenses = parseMoney(expensesText);
  const businessLoss = expenses > selfEmployment;

  const investmentTotal =
    parseMoney(incomeText.longTermCapitalGains) +
    parseMoney(incomeText.otherInvestmentIncome);

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
      {/*
       * Split by source rather than one total, because each is taxed under a
       * different rule: wages carry FICA, 1099 income carries self-employment
       * tax, and long-term gains get their own 0/15/20% table.
       */}
      <MoneyField
        label="W-2 wages"
        icon={<Briefcase />}
        value={incomeText.wages}
        onChange={set("wages")}
      />

      <MoneyField
        label="Self-employment / 1099 revenue"
        icon={<PiggyBank />}
        value={incomeText.selfEmployment}
        onChange={set("selfEmployment")}
      />

      {selfEmployment > 0 ? (
        <MoneyField
          label="Business expenses"
          icon={<Receipt />}
          value={expensesText}
          onChange={onExpensesChange}
        />
      ) : null}

      <Disclosure
        icon={<LineChart />}
        title="Investment income"
        aside={investmentTotal > 0 ? formatCurrency(investmentTotal) : "None"}
        defaultOpen={investmentTotal > 0}
      >
        <div className="space-y-5">
          <MoneyField
            label="Long-term capital gains & qualified dividends"
            icon={<LineChart />}
            value={incomeText.longTermCapitalGains}
            onChange={set("longTermCapitalGains")}
          />

          <MoneyField
            label="Interest, ordinary dividends & short-term gains"
            icon={<Landmark />}
            value={incomeText.otherInvestmentIncome}
            onChange={set("otherInvestmentIncome")}
          />
        </div>
      </Disclosure>

      <Readout
        label="Total income"
        value={formatCurrency(netProfit)}
        tone={netProfit > 0 ? "keep" : "default"}
      />

      {businessLoss ? (
        <Alert>
          <TriangleAlert className="text-note-ink" />
          <AlertTitle>Business expenses exceed your revenue</AlertTitle>
          <AlertDescription>
            The business is at a loss, so it contributes nothing to income here.
            This calculator does not carry the loss against your other income.
          </AlertDescription>
        </Alert>
      ) : null}

      {netProfit <= 0 ? (
        <Alert>
          <TriangleAlert className="text-tax" />
          <AlertTitle>No income to tax yet</AlertTitle>
          <AlertDescription>
            Enter what you earned this year to continue.
          </AlertDescription>
        </Alert>
      ) : null}
    </StepCard>
  );
}
