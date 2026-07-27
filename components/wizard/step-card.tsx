"use client";

import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * The frame every step shares: an icon, the question being asked, one line of
 * plain-language context, and a footer that carries the Back / Continue pair.
 */
export function StepCard({
  icon,
  eyebrow,
  title,
  description,
  children,
  footer,
  className,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "animate-step-in rounded-2xl shadow-sm ring-foreground/8 [--card-spacing:--spacing(6)]",
        className,
      )}
    >
      <CardHeader className="gap-2">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground [&_svg]:size-4.5">
            {icon}
          </span>
          <div className="grid gap-0.5">
            <span className="text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase">
              {eyebrow}
            </span>
            <CardTitle className="text-xl leading-tight font-semibold tracking-tight">
              {title}
            </CardTitle>
          </div>
        </div>
        <CardDescription className="text-[0.9rem] leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-1">{children}</CardContent>

      {footer}
    </Card>
  );
}

/** Footer navigation. Must be passed as `StepCard`'s `footer` to sit correctly. */
export function StepNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  extra,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  extra?: ReactNode;
}) {
  return (
    <CardFooter className="flex-wrap justify-between gap-3 bg-muted/40 px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-1">
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="h-10 px-3 text-[0.9rem]"
          >
            <ArrowLeft data-icon="inline-start" />
            {backLabel}
          </Button>
        ) : null}
        {extra}
      </div>

      {onNext ? (
        <Button
          type="button"
          onClick={onNext}
          className="h-10 px-5 text-[0.9rem]"
        >
          {nextLabel}
          <ArrowRight data-icon="inline-end" />
        </Button>
      ) : null}
    </CardFooter>
  );
}
