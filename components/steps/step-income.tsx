"use client";

import type { ReactNode } from "react";
import {
  Briefcase,
  Building2,
  CircleDollarSign,
  Landmark,
  LineChart,
  PiggyBank,
  Receipt,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
  Umbrella,
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
  retirementDistributions: string;
  unemployment: string;
  otherOrdinaryIncome: string;
  rentalRoyalty: string;
  otherInvestmentIncome: string;
  longTermCapitalGains: string;
  socialSecurityBenefits: string;
  taxExemptInterest: string;
}

interface Field {
  key: keyof IncomeText;
  label: string;
  icon: ReactNode;
}

/**
 * Everything except wages and 1099 revenue lives in one of these groups, so
 * the step opens with two fields rather than ten. Each group's header carries
 * a running total, so nothing entered inside stays hidden.
 */
const GROUPS: { title: string; icon: ReactNode; fields: Field[] }[] = [
  {
    title: "Investment income",
    icon: <LineChart />,
    fields: [
      {
        key: "longTermCapitalGains",
        label: "Long-term capital gains & qualified dividends",
        icon: <TrendingUp />,
      },
      {
        key: "otherInvestmentIncome",
        label: "Interest, ordinary dividends & short-term gains",
        icon: <Landmark />,
      },
      {
        key: "rentalRoyalty",
        label: "Rental & royalty income (Schedule E)",
        icon: <Building2 />,
      },
      {
        key: "taxExemptInterest",
        label: "Tax-exempt interest (municipal bonds)",
        icon: <ShieldCheck />,
      },
    ],
  },
  {
    title: "Retirement & benefits",
    icon: <Umbrella />,
    fields: [
      {
        key: "retirementDistributions",
        label: "Retirement distributions — IRA, 401(k), pension (1099-R)",
        icon: <PiggyBank />,
      },
      {
        key: "socialSecurityBenefits",
        label: "Social Security benefits (SSA-1099)",
        icon: <Umbrella />,
      },
    ],
  },
  {
    title: "Other income",
    icon: <CircleDollarSign />,
    fields: [
      {
        key: "unemployment",
        label: "Unemployment compensation (1099-G)",
        icon: <CircleDollarSign />,
      },
      {
        key: "otherOrdinaryIncome",
        label: "Alimony, gambling, prizes & other",
        icon: <CircleDollarSign />,
      },
    ],
  },
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
       * Grouped by tax treatment, not by form number: wages carry FICA, 1099
       * income carries self-employment tax, long-term gains get their own
       * table, and Social Security is taxed on a formula of its own.
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

      <div className="space-y-2">
        {GROUPS.map((group) => {
          const total = group.fields.reduce(
            (sum, field) => sum + parseMoney(incomeText[field.key]),
            0,
          );

          return (
            <Disclosure
              key={group.title}
              icon={group.icon}
              title={group.title}
              aside={total > 0 ? formatCurrency(total) : "None"}
              defaultOpen={total > 0}
            >
              <div className="space-y-5">
                {group.fields.map((field) => (
                  <MoneyField
                    key={field.key}
                    label={field.label}
                    icon={field.icon}
                    value={incomeText[field.key]}
                    onChange={set(field.key)}
                  />
                ))}
              </div>
            </Disclosure>
          );
        })}
      </div>

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
