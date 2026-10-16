
import { Disclosure } from "@/components/ui-extras/disclosure";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBracketRange, formatCurrency, formatRate } from "@/lib/format";
import type { ProgressiveResult } from "@/lib/types";
import { cn } from "@/lib/utils";

/** One line of the walk from AGI down to the income the brackets apply to. */
export interface BasisLine {
  label: string;
  value: number;
  /** A subtraction, shown with a minus sign. */
  deduction?: boolean;
  /** Added back, shown with a plus sign. */
  addition?: boolean;
  /** The result line, set off by a rule. */
  total?: boolean;
}

/**
 * The chunk-by-chunk audit trail: which bracket each slice of income landed in
 * and what it cost. `basis` shows first how the taxed amount was reached, so
 * the deductions in force are on the page rather than implied.
 */
export function BracketTable({
  title,
  result,
  basis,
  emptyMessage = "No tax due at this income level.",
}: {
  title: string;
  result: ProgressiveResult;
  basis?: BasisLine[];
  emptyMessage?: string;
}) {
  return (
    <Disclosure
      title={title}
      aside={<span className="tnum">{formatCurrency(result.tax)}</span>}
    >
      {basis?.length ? (
        <dl className="mb-4 space-y-1.5">
          {basis.map((line) => (
            <div
              key={line.label}
              className={cn(
                "flex items-baseline justify-between gap-3",
                line.total && "border-t border-border pt-1.5",
              )}
            >
              <dt className="min-w-0 text-[0.8rem] text-foreground/80">{line.label}</dt>
              <dd
                className={cn(
                  "tnum shrink-0 text-[0.8rem] whitespace-nowrap",
                  line.total && "font-semibold",
                )}
              >
                {line.deduction
                  ? `−${formatCurrency(line.value)}`
                  : line.addition
                    ? `+${formatCurrency(line.value)}`
                    : formatCurrency(line.value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {result.slices.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 pr-2 pl-0 text-muted-foreground">Bracket</TableHead>
              <TableHead className="h-8 px-2 text-right text-muted-foreground">
                Rate
              </TableHead>
              <TableHead className="hidden h-8 px-2 text-right sm:table-cell text-muted-foreground">
                Taxed here
              </TableHead>
              <TableHead className="h-8 px-2 text-right text-muted-foreground">
                Tax
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.slices.map((slice) => (
              <TableRow key={`${slice.rate}-${slice.min}`}>
                <TableCell className="tnum py-2 pl-0 text-muted-foreground">
                  {formatBracketRange(slice.min, slice.max)}
                </TableCell>
                <TableCell className="tnum py-2 text-right font-medium">
                  {formatRate(slice.rate)}
                </TableCell>
                <TableCell className="tnum hidden py-2 text-right text-muted-foreground sm:table-cell">
                  {formatCurrency(slice.amountInBracket)}
                </TableCell>
                <TableCell className="tnum py-2 text-right font-semibold">
                  {formatCurrency(slice.tax)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Disclosure>
  );
}
