"use client";

import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface StepMeta {
  id: string;
  /** Two or three words, shown in the stepper. */
  short: string;
  /** The question the step asks, shown on the card itself. */
  title: string;
}

/**
 * Numbered progress across the top of the wizard. Steps already visited stay
 * clickable so a wrong answer is one tap away; steps ahead are inert.
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
  const last = steps.length - 1;

  return (
    <nav aria-label="Progress">
      {/*
       * Below md the five labelled pills cannot fit on one line without
       * wrapping mid-word, so phones and small tablets get a bar instead.
       */}
      <div className="md:hidden">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-sm font-medium">
            {steps[current].short}
          </span>
          <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
            Step {current + 1} of {steps.length}
          </span>
        </div>
        <Progress value={((current + 1) / steps.length) * 100} className="h-1.5" />
      </div>

      <ol className="hidden items-center md:flex">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const reachable = index <= furthest;

          return (
            <li
              key={step.id}
              className={cn("flex items-center", index < last && "flex-1")}
            >
              <button
                type="button"
                onClick={() => reachable && onJump(index)}
                disabled={!reachable}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full py-1 pr-2.5 pl-1 transition-colors outline-none",
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                  reachable ? "cursor-pointer" : "cursor-default",
                  reachable && !active && "hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    done && "bg-primary text-primary-foreground",
                    active && "bg-primary/12 text-primary ring-2 ring-primary",
                    !done && !active && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={cn(
                    "text-sm whitespace-nowrap transition-colors",
                    active
                      ? "font-semibold text-foreground"
                      : done
                        ? "font-medium text-foreground/70"
                        : "text-muted-foreground",
                  )}
                >
                  {step.short}
                </span>
              </button>

              {index < last ? (
                <span
                  aria-hidden
                  className={cn(
                    "mx-2 h-px min-w-2 flex-1 transition-colors",
                    done ? "bg-primary/35" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
