"use client";

import { cn } from "@/lib/utils";

export interface StepMeta {
  id: string;
  /** One or two words, shown under the stepper's segments. */
  short: string;
  /** The question the step asks, shown on the sheet itself. */
  title: string;
}

/**
 * Five segments, one per step — the same shape on every screen. Labels sit
 * under the segments from `sm` up; phones get a single "Step 2 of 5" line
 * instead, since five labels cannot share a 320px row. Steps already visited
 * stay clickable so a wrong answer is one tap away; steps ahead are inert.
 */
export function Stepper({
  steps,
  current,
  furthest,
  onJump,
}: {
  steps: StepMeta[];
  current: number;
  furthest: number;
  onJump: (index: number) => void;
}) {
  return (
    <nav aria-label="Progress">
      <p className="flex items-baseline gap-2 text-xs sm:hidden">
        <span className="tnum font-medium text-muted-foreground">
          Step {current + 1} of {steps.length}
        </span>
        <span aria-hidden className="text-muted-foreground/50">
          ·
        </span>
        <span className="truncate font-semibold">{steps[current].short}</span>
      </p>

      <ol className="flex gap-1.5">
        {steps.map((step, index) => {
          const active = index === current;
          const reached = index <= current;
          const reachable = index <= furthest;

          return (
            <li key={step.id} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => reachable && onJump(index)}
                disabled={!reachable}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${step.short}`}
                className={cn(
                  // Tall hit area on phones; the visible bar stays a hairline.
                  "group block w-full rounded-md py-3.5 text-left outline-none sm:py-1.5",
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                  reachable ? "cursor-pointer" : "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "block h-1 rounded-full transition-colors duration-300",
                    reached ? "bg-foreground" : "bg-border",
                    reachable && !reached && "bg-foreground/25 group-hover:bg-foreground/40",
                  )}
                />
                <span
                  className={cn(
                    "mt-2 hidden truncate text-xs transition-colors sm:block",
                    active
                      ? "font-semibold text-foreground"
                      : reachable
                        ? "text-muted-foreground group-hover:text-foreground"
                        : "text-muted-foreground/60",
                  )}
                >
                  {step.short}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
