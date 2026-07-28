import type { ReactNode } from "react";
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

/**
 * The chunk-by-chunk audit trail: which bracket each slice of income landed in
 * and what it cost. Rendered plainly — the caller decides whether to hide it,
 * so the results page can keep every detail behind one single toggle.
 */
export function BracketTable({
  title,
  icon,
  result,
  emptyMessage = "No tax due at this income level.",
}: {
  title: string;
  icon?: ReactNode;
  result: ProgressiveResult;
  emptyMessage?: string;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex min-w-0 items-center gap-2 text-[0.85rem] font-semibold">
          {icon ? (
            <span className="shrink-0 text-muted-foreground [&_svg]:size-4">
              {icon}
            </span>
          ) : null}
          {title}
        </h3>
        <span className="tnum shrink-0 text-[0.85rem] font-semibold whitespace-nowrap">
          {formatCurrency(result.tax)}
        </span>
      </div>

      {result.slices.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 px-2 text-muted-foreground">Bracket</TableHead>
              <TableHead className="h-8 px-2 text-right text-muted-foreground">
                Rate
              </TableHead>
              <TableHead className="h-8 px-2 text-right text-muted-foreground">
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
                <TableCell className="tnum py-2 text-muted-foreground">
                  {formatBracketRange(slice.min, slice.max)}
                </TableCell>
                <TableCell className="tnum py-2 text-right font-medium">
                  {formatRate(slice.rate)}
                </TableCell>
                <TableCell className="tnum py-2 text-right text-muted-foreground">
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
    </section>
  );
}
