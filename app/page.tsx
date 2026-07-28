"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import logo from "@/public/logo.png";
import { StepGiving } from "@/components/steps/step-giving";
import { StepIncome } from "@/components/steps/step-income";
import { StepPlace } from "@/components/steps/step-place";
import { StepResults } from "@/components/steps/step-results";
import { StepTax } from "@/components/steps/step-tax";
import { ContextBar } from "@/components/wizard/context-bar";
import { Stepper, type StepMeta } from "@/components/wizard/stepper";
import { parseMoney, toMoneyInput } from "@/lib/format";
import { buildComparison, calculateNetProfit, KHUMS_RATE } from "@/lib/tax";
import { states, taxYear } from "@/lib/taxData";
import type { DeductionMode, FilingStatus } from "@/lib/types";

const STEPS: StepMeta[] = [
  { id: "place", short: "State", title: "Where do you file?" },
  { id: "income", short: "Income", title: "What did you earn?" },
  { id: "tax", short: "Your tax", title: "This is what you owe" },
  { id: "giving", short: "Giving", title: "How much will you give?" },
  { id: "results", short: "Results", title: "Your results" },
];

const DEFAULTS = {
  stateCode: "CA",
  filingStatus: "single" as FilingStatus,
  incomeText: "",
  expensesText: "",
  donationText: "",
  deductionMode: "stacked" as DeductionMode,
  matchKhums: false,
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);

  const [stateCode, setStateCode] = useState(DEFAULTS.stateCode);
  const [filingStatus, setFilingStatus] = useState<FilingStatus>(DEFAULTS.filingStatus);
  const [incomeText, setIncomeText] = useState(DEFAULTS.incomeText);
  const [expensesText, setExpensesText] = useState(DEFAULTS.expensesText);
  const [donationText, setDonationText] = useState(DEFAULTS.donationText);
  const [deductionMode, setDeductionMode] = useState<DeductionMode>(
    DEFAULTS.deductionMode,
  );
  const [matchKhums, setMatchKhums] = useState(DEFAULTS.matchKhums);

  const netProfit = useMemo(
    () => calculateNetProfit(parseMoney(incomeText), parseMoney(expensesText)),
    [incomeText, expensesText],
  );
  const khumsObligation = netProfit * KHUMS_RATE;

  // While auto-matching is on, the field displays (and the engine uses) the
  // khums obligation directly instead of whatever was last typed, so it stays
  // in sync as income/expenses change upstream — no effect required.
  const effectiveDonationText = matchKhums
    ? toMoneyInput(khumsObligation)
    : donationText;

  const comparison = useMemo(
    () =>
      buildComparison({
        totalIncome: parseMoney(incomeText),
        expenses: parseMoney(expensesText),
        donation: parseMoney(effectiveDonationText),
        filingStatus,
        stateCode,
        deductionMode,
      }),
    [
      incomeText,
      expensesText,
      effectiveDonationText,
      filingStatus,
      stateCode,
      deductionMode,
    ],
  );

  function goTo(index: number) {
    const next = Math.min(Math.max(index, 0), STEPS.length - 1);
    setStep(next);
    setFurthest((current) => Math.max(current, next));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function restart() {
    setStateCode(DEFAULTS.stateCode);
    setFilingStatus(DEFAULTS.filingStatus);
    setIncomeText(DEFAULTS.incomeText);
    setExpensesText(DEFAULTS.expensesText);
    setDonationText(DEFAULTS.donationText);
    setDeductionMode(DEFAULTS.deductionMode);
    setMatchKhums(DEFAULTS.matchKhums);
    setFurthest(0);
    setStep(0);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-20 sm:px-6">
        <div className="mb-5 space-y-3">
          <Stepper
            steps={STEPS}
            current={step}
            furthest={furthest}
            onJump={goTo}
          />
          <ContextBar comparison={comparison} filingStatus={filingStatus} />
        </div>

        {step === 0 ? (
          <StepPlace
            stateCode={stateCode}
            filingStatus={filingStatus}
            onStateChange={setStateCode}
            onFilingStatusChange={setFilingStatus}
            onNext={() => goTo(1)}
          />
        ) : null}

        {step === 1 ? (
          <StepIncome
            incomeText={incomeText}
            expensesText={expensesText}
            netProfit={comparison.netProfit}
            rawNetProfit={parseMoney(incomeText) - parseMoney(expensesText)}
            onIncomeChange={setIncomeText}
            onExpensesChange={setExpensesText}
            onBack={() => goTo(0)}
            onNext={() => goTo(2)}
          />
        ) : null}

        {step === 2 ? (
          <StepTax
            scenario={comparison.scenarioA}
            stateEntry={comparison.stateEntry}
            onBack={() => goTo(1)}
            onDonate={() => goTo(3)}
            onSkip={() => {
              setMatchKhums(false);
              setDonationText("");
              goTo(4);
            }}
          />
        ) : null}

        {step === 3 ? (
          <StepGiving
            donationText={effectiveDonationText}
            deductionMode={deductionMode}
            matchKhums={matchKhums}
            comparison={comparison}
            onDonationChange={setDonationText}
            onDeductionModeChange={setDeductionMode}
            onMatchKhumsChange={setMatchKhums}
            onBack={() => goTo(2)}
            onNext={() => goTo(4)}
          />
        ) : null}

        {step === 4 ? (
          <StepResults
            comparison={comparison}
            onBack={() => goTo(3)}
            onRestart={restart}
          />
        ) : null}
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-border bg-card/70 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Image
            src={logo}
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0"
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">OptimaTax</p>
            <p className="text-xs text-muted-foreground">
              Tax and giving — step by step
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {taxYear} rates · {states.length} jurisdictions
        </p>
      </div>
    </header>
  );
}
