"use client";

import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The sheet every step shares: the question, the controls, and a footer for
 * Back / Continue. Deliberately not a shadcn `Card` — that clips overflow,
 * which would stop the footer from sticking to the bottom of a phone screen.
 */
export function StepCard({
  title,
  subtitle,
  children,
  footer,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="step-title"
      className={cn(
        "animate-step-in rounded-[1.75rem] border border-border bg-card",
        className,
      )}
    >
      <header className="px-5 pt-6 sm:px-8 sm:pt-8">
        <h1
          id="step-title"
          className="font-display text-[2.1rem] leading-[1.05] tracking-tight sm:text-[2.6rem]"
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </header>

      <div className="space-y-7 px-5 pt-6 pb-7 sm:px-8 sm:pb-8">{children}</div>

      {footer}
    </section>
  );
}

/**
 * Footer navigation. Pass as `StepCard`'s `footer`. On phones it sticks to the
 * bottom edge so Continue is always under the thumb; from `sm` up it sits at
 * the foot of the sheet.
 */
export function StepNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  sticky = true,
  children,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  /** Off when the step's real choices live in its body, not the footer. */
  sticky?: boolean;
  /** Replaces the Continue button. */
  children?: ReactNode;
}) {
  // Back alone gets its label on phones too; an unlabelled circle looks lost.
  const backOnly = !children && !onNext;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-b-[1.75rem] border-t border-border px-4 py-3",
        sticky &&
          "sticky bottom-0 z-10 bg-card/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md",
        "sm:static sm:gap-3 sm:bg-transparent sm:px-8 sm:py-4 sm:backdrop-blur-none",
      )}
    >
      {onBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          aria-label="Back"
          className={cn(
            "size-12 shrink-0 rounded-full p-0 sm:h-11 sm:w-auto sm:px-5",
            backOnly && "w-auto px-5",
          )}
        >
          <ArrowLeft />
          <span className={backOnly ? "" : "hidden sm:inline"}>Back</span>
        </Button>
      ) : null}

      <div className="flex min-w-0 flex-1 justify-end gap-2">
        {children ??
          (onNext ? (
            <Button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              className="h-12 w-full rounded-full px-6 text-[0.95rem] sm:h-11 sm:w-auto"
            >
              {nextLabel}
              <ArrowRight data-icon="inline-end" />
            </Button>
          ) : null)}
      </div>
    </div>
  );
}
