"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import logo from "@/public/logo.png";
import { StepGiving } from "@/components/steps/step-giving";
import { StepIncome, type IncomeText } from "@/components/steps/step-income";
import { StepPlace } from "@/components/steps/step-place";
import { StepQuick } from "@/components/steps/step-quick";
import { StepResults } from "@/components/steps/step-results";
import { StepTax } from "@/components/steps/step-tax";
import { ModeToggle, type WizardMode } from "@/components/wizard/mode-toggle";
import { Stepper, type StepMeta } from "@/components/wizard/stepper";
import { parseMoney, toMoneyInput } from "@/lib/format";
import { buildComparison, calculateNetProfit, KHUMS_RATE } from "@/lib/tax";
import { taxYear } from "@/lib/taxData";
import type {
  DeductionMode,
  Dependents,
  FilingStatus,
  IncomeSources,
} from "@/lib/types";

const STEPS: StepMeta[] = [
  { id: "place", short: "You", title: "About you" },
  { id: "income", short: "Income", title: "What did you earn?" },
  { id: "tax", short: "Your tax", title: "This is what you owe" },
  { id: "giving", short: "Giving", title: "How much will you give?" },
  { id: "results", short: "Results", title: "Your results" },
];

const EMPTY_INCOME: IncomeText = {
  wages: "",
  selfEmployment: "",
  retirementDistributions: "",
  unemployment: "",
  otherOrdinaryIncome: "",
  rentalRoyalty: "",
  otherInvestmentIncome: "",
  longTermCapitalGains: "",
  socialSecurityBenefits: "",
  taxExemptInterest: "",
};

const EMPTY_INCOME_SOURCES: IncomeSources = {
  wages: 0,
  selfEmployment: 0,
  retirementDistributions: 0,
  unemployment: 0,
  otherOrdinaryIncome: 0,
  rentalRoyalty: 0,
  otherInvestmentIncome: 0,
  longTermCapitalGains: 0,
  socialSecurityBenefits: 0,
  taxExemptInterest: 0,
};

const DEFAULTS = {
  stateCode: "CA",
  filingStatus: "single" as FilingStatus,
  incomeText: EMPTY_INCOME,
  expensesText: "",
  donationText: "",
  deductionMode: "stacked" as DeductionMode,
  matchKhums: false,
  dependents: { qualifyingChildren: 0, otherDependents: 0 } as Dependents,
};

export default function Home() {
  const [mode, setMode] = useState<WizardMode>("detailed");
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);

  // Quick estimate keeps its own answers and screen; only state and filing
  // status are shared with the detailed flow, since they mean the same thing.
  const [quickResults, setQuickResults] = useState(false);
  const [quickAgiText, setQuickAgiText] = useState("");
  const [quickDonationText, setQuickDonationText] = useState("");

  const [stateCode, setStateCode] = useState(DEFAULTS.stateCode);
  const [filingStatus, setFilingStatus] = useState<FilingStatus>(DEFAULTS.filingStatus);
  const [incomeText, setIncomeText] = useState<IncomeText>(DEFAULTS.incomeText);
  const [expensesText, setExpensesText] = useState(DEFAULTS.expensesText);
  const [donationText, setDonationText] = useState(DEFAULTS.donationText);
  const [deductionMode, setDeductionMode] = useState<DeductionMode>(
    DEFAULTS.deductionMode,
  );
  const [matchKhums, setMatchKhums] = useState(DEFAULTS.matchKhums);
  const [dependents, setDependents] = useState<Dependents>(DEFAULTS.dependents);

  const income = useMemo(
    () => ({
      wages: parseMoney(incomeText.wages),
      selfEmployment: parseMoney(incomeText.selfEmployment),
      retirementDistributions: parseMoney(incomeText.retirementDistributions),
      unemployment: parseMoney(incomeText.unemployment),
      otherOrdinaryIncome: parseMoney(incomeText.otherOrdinaryIncome),
      rentalRoyalty: parseMoney(incomeText.rentalRoyalty),
      otherInvestmentIncome: parseMoney(incomeText.otherInvestmentIncome),
      longTermCapitalGains: parseMoney(incomeText.longTermCapitalGains),
      socialSecurityBenefits: parseMoney(incomeText.socialSecurityBenefits),
      taxExemptInterest: parseMoney(incomeText.taxExemptInterest),
    }),
    [incomeText],
  );

  const expenses = parseMoney(expensesText);
  const netProfit = useMemo(
    () => calculateNetProfit(income, expenses),
    [income, expenses],
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
        income,
        expenses,
        donation: parseMoney(effectiveDonationText),
        filingStatus,
        stateCode,
        deductionMode,
        dependents,
      }),
    [
      income,
      expenses,
      effectiveDonationText,
      filingStatus,
      stateCode,
      deductionMode,
      dependents,
    ],
  );

  // One AGI figure goes in as ordinary income, so the engine's AGI equals it.
  // "Itemized" is the real IRS rule, which is when the 0.5% floor applies.
  const quickComparison = useMemo(
    () =>
      buildComparison({
        income: { ...EMPTY_INCOME_SOURCES, otherOrdinaryIncome: parseMoney(quickAgiText) },
        expenses: 0,
        donation: parseMoney(quickDonationText),
        filingStatus,
        stateCode,
        deductionMode: "itemized",
        dependents: DEFAULTS.dependents,
        applyCharitableFloor: true,
      }),
    [quickAgiText, quickDonationText, filingStatus, stateCode],
  );

  function showQuickResults(show: boolean) {
    setQuickResults(show);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

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
    setDependents(DEFAULTS.dependents);
    setQuickAgiText("");
    setQuickDonationText("");
    setQuickResults(false);
    setFurthest(0);
    setStep(0);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-4 pb-10 sm:px-6 sm:pt-8 sm:pb-16">
        <div className="mb-4 sm:mb-5">
          <ModeToggle value={mode} onChange={setMode} />
        </div>

        {mode === "quick" ? (
          quickResults ? (
            <StepResults
              comparison={quickComparison}
              onBack={() => showQuickResults(false)}
              onRestart={restart}
            />
          ) : (
            <StepQuick
              agiText={quickAgiText}
              filingStatus={filingStatus}
              stateCode={stateCode}
              donationText={quickDonationText}
              onAgiChange={setQuickAgiText}
              onFilingStatusChange={setFilingStatus}
              onStateChange={setStateCode}
              onDonationChange={setQuickDonationText}
              onNext={() => showQuickResults(true)}
            />
          )
        ) : null}

        {mode === "detailed" ? (
          <div className="mb-5 sm:mb-6">
            <Stepper
              steps={STEPS}
              current={step}
              furthest={furthest}
              onJump={goTo}
            />
          </div>
        ) : null}

        {mode === "detailed" && step === 0 ? (
          <StepPlace
            stateCode={stateCode}
            filingStatus={filingStatus}
            dependents={dependents}
            onStateChange={setStateCode}
            onFilingStatusChange={setFilingStatus}
            onDependentsChange={setDependents}
            onNext={() => goTo(1)}
          />
        ) : null}

        {mode === "detailed" && step === 1 ? (
          <StepIncome
            incomeText={incomeText}
            expensesText={expensesText}
            netProfit={comparison.netProfit}
            onIncomeChange={setIncomeText}
            onExpensesChange={setExpensesText}
            onBack={() => goTo(0)}
            onNext={() => goTo(2)}
          />
        ) : null}

        {mode === "detailed" && step === 2 ? (
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

        {mode === "detailed" && step === 3 ? (
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

        {mode === "detailed" && step === 4 ? (
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

/**
 * One row at every width: logo and name on the left, the rate year on the
 * right. Nothing wraps, so the two sides always share a baseline on a phone.
 */
function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Image
            src={logo}
            alt=""
            width={28}
            height={28}
            className="size-7 shrink-0"
          />
          <span className="font-display truncate text-[1.4rem] leading-none tracking-tight">
            OptimaTax
          </span>
        </div>

        <span className="tnum shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium whitespace-nowrap text-muted-foreground">
          {taxYear} rates
        </span>
      </div>
    </header>
  );
}
