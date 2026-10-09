"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import logo from "@/public/logo.png";
import { StepGiving } from "@/components/steps/step-giving";
import { StepIncome, type IncomeText } from "@/components/steps/step-income";
import { StepPlace } from "@/components/steps/step-place";
import {
  QUICK_STEPS,
  StepQuickGift,
  StepQuickIncome,
  StepQuickPlace,
} from "@/components/steps/step-quick";
import { StepResults } from "@/components/steps/step-results";
import { StepTax } from "@/components/steps/step-tax";
import { ModeToggle, type WizardMode } from "@/components/wizard/mode-toggle";
import { Stepper, type StepMeta } from "@/components/wizard/stepper";
import { formatIsoDate, parseMoney, toMoneyInput } from "@/lib/format";
import {
  buildComparison,
  calculateNetProfit,
  KHUMS_RATE,
  quickEstimateToCalculatorInput,
} from "@/lib/tax";
import { ratesLastUpdated, taxYear } from "@/lib/taxData";
import type {
  CharityType,
  DeductionMode,
  Dependents,
  FilingStatus,
  PropertyType,
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
  const [mode, setMode] = useState<WizardMode>("quick");
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);

  // Quick estimate keeps its own answers and screen; only state and filing
  // status are shared with the detailed flow, since they mean the same thing.
  const [quickStep, setQuickStep] = useState(0);
  const [quickFurthest, setQuickFurthest] = useState(0);
  const [quickAgiText, setQuickAgiText] = useState("");
  const [quickItemizedText, setQuickItemizedText] = useState("");
  const [quickDonationText, setQuickDonationText] = useState("");
  const [quickCharityType, setQuickCharityType] = useState<CharityType>("public");
  const [quickPropertyType, setQuickPropertyType] = useState<PropertyType>("cash");

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

  const quickComparison = useMemo(
    () =>
      buildComparison(
        quickEstimateToCalculatorInput(
          {
            agi: parseMoney(quickAgiText),
            itemizedExpenses: parseMoney(quickItemizedText),
            donationAmount: parseMoney(quickDonationText),
            charityType: quickCharityType,
            propertyType: quickPropertyType,
          },
          filingStatus,
          stateCode,
        ),
      ),
    [
      quickAgiText,
      quickItemizedText,
      quickDonationText,
      quickCharityType,
      quickPropertyType,
      filingStatus,
      stateCode,
    ],
  );

  function goToQuick(index: number) {
    const next = Math.min(Math.max(index, 0), QUICK_STEPS.length - 1);
    setQuickStep(next);
    setQuickFurthest((current) => Math.max(current, next));
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
    setQuickItemizedText("");
    setQuickDonationText("");
    setQuickCharityType("public");
    setQuickPropertyType("cash");
    setQuickStep(0);
    setQuickFurthest(0);
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

        <div className="mb-5 sm:mb-6">
          {mode === "quick" ? (
            <Stepper
              steps={QUICK_STEPS}
              current={quickStep}
              furthest={quickFurthest}
              onJump={goToQuick}
            />
          ) : (
            <Stepper
              steps={STEPS}
              current={step}
              furthest={furthest}
              onJump={goTo}
            />
          )}
        </div>

        {mode === "quick" && quickStep === 0 ? (
          <StepQuickPlace
            filingStatus={filingStatus}
            stateCode={stateCode}
            onFilingStatusChange={setFilingStatus}
            onStateChange={setStateCode}
            onNext={() => goToQuick(1)}
          />
        ) : null}

        {mode === "quick" && quickStep === 1 ? (
          <StepQuickIncome
            agiText={quickAgiText}
            itemizedText={quickItemizedText}
            onAgiChange={setQuickAgiText}
            onItemizedChange={setQuickItemizedText}
            onBack={() => goToQuick(0)}
            onNext={() => goToQuick(2)}
          />
        ) : null}

        {mode === "quick" && quickStep === 2 ? (
          <StepQuickGift
            agiText={quickAgiText}
            donationText={quickDonationText}
            charityType={quickCharityType}
            propertyType={quickPropertyType}
            onDonationChange={setQuickDonationText}
            onCharityTypeChange={setQuickCharityType}
            onPropertyTypeChange={setQuickPropertyType}
            onBack={() => goToQuick(1)}
            onNext={() => goToQuick(3)}
          />
        ) : null}

        {mode === "quick" && quickStep === 3 ? (
          <StepResults
            comparison={quickComparison}
            onBack={() => goToQuick(2)}
            onRestart={restart}
          />
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

      <Credits />
    </div>
  );
}

/**
 * When the rates last changed, then who built this. The credit line stacks on
 * a phone and sits on one line from `sm` up.
 */
function Credits() {
  return (
    <footer className="border-t border-border/70 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <p className="tnum mx-auto w-full max-w-xl px-4 pt-5 text-center text-xs text-muted-foreground sm:px-6 sm:text-left">
        {taxYear} tax rates · last updated{" "}
        <time dateTime={ratesLastUpdated}>{formatIsoDate(ratesLastUpdated)}</time>
      </p>
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-1 px-4 pt-3 pb-5 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <p>
          Built by{" "}
          <span className="font-medium text-foreground">Abedallatif Srour</span>
          <span aria-hidden> · </span>
          Software Engineer
        </p>
        <a
          href="tel:+96176675348"
          className="tnum rounded-sm underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          +961 76 675 348
        </a>
      </div>
    </footer>
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
