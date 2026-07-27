"use client";

import { MapPin, User } from "lucide-react";
import { filingStatuses } from "@/lib/taxData";
import type { FilingStatus, StateTaxEntry } from "@/lib/types";

/**
 * The two answers every later figure depends on, kept in view for the whole
 * wizard so nobody reaches the results wondering which state they picked.
 */
export function ContextBar({
  stateEntry,
  filingStatus,
}: {
  stateEntry: StateTaxEntry;
  filingStatus: FilingStatus;
}) {
  const status = filingStatuses.find((entry) => entry.id === filingStatus);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Chip icon={<MapPin className="size-3.5 shrink-0" />}>
        {stateEntry.name}
        <span className="text-muted-foreground">{stateEntry.code}</span>
      </Chip>
      <Chip icon={<User className="size-3.5 shrink-0" />}>{status?.label}</Chip>
    </div>
  );
}

function Chip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground/80">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex min-w-0 items-center gap-1.5 truncate">{children}</span>
    </span>
  );
}
