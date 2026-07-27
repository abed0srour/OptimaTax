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

/**
 * The chunk-by-chunk audit trail: which bracket each slice of income landed in
 * and what it cost.
 */
export function BracketTable({
  title,
  result,
  emptyMessage = "No tax due at this income level.",
}: {
  title: string;
  result: ProgressiveResult;
  emptyMessage?: string;
}) {
  return (
    <Disclosure
      title={title}
      aside={<span className="tnum">{formatCurrency(result.tax)}</span>}
      className="bg-card"
    >
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
    </Disclosure>
  );
}
