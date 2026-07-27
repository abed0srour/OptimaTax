import { Disclosure } from "@/components/ui-extras/disclosure";
import { formatPercent } from "@/lib/format";
import { dataNotes, federalTax, stateTaxYear, taxYear } from "@/lib/taxData";

/** Everything this model does not do, kept honest and kept out of the way. */
export function Limitations({ stateNote }: { stateNote?: string }) {
  return (
    <Disclosure title="Scope and limitations" aside="Read before acting">
      <ul className="list-disc space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground">
        <li>
          Ordinary income only. Payroll and self-employment tax, AMT, QBI, credits, and
          phaseouts are not modelled. The {taxYear} dataset also carries long-term
          capital gains brackets, the{" "}
          {formatPercent(federalTax.net_investment_income_tax.rate, 1)} net investment
          income tax, and the{" "}
          {formatPercent(federalTax.additional_medicare_tax.rate, 1)} additional Medicare
          tax — none of which this tool applies yet.
        </li>
        <li>
          State brackets in this dataset are{" "}
          <strong className="font-semibold text-foreground">
            single-filer schedules only
          </strong>
          , applied regardless of the filing status you chose. Joint filers will see
          state tax overstated.
        </li>
        <li>
          The dataset carries{" "}
          <strong className="font-semibold text-foreground">
            no state standard deductions or exemptions
          </strong>
          , so state taxable income is the full net profit less any deductible gift. Real
          state bills are generally lower.
        </li>
        <li>
          State-level income tax only — city and county income taxes (NYC, Maryland
          counties, Ohio municipalities, and others) are excluded.
        </li>
        <li>
          Khums rulings vary by school and marja&apos;. This computes the common one
          fifth of annual surplus; it does not decide whether a given 501(c)(3) is a
          valid recipient of sahm al-imam or sahm al-sada.
        </li>
        {stateNote ? <li>{stateNote}</li> : null}
        <li>
          Federal: {dataNotes.federalSource}. State schedules are for {stateTaxYear} —{" "}
          {dataNotes.stateNotes}
        </li>
        <li className="font-medium text-foreground">
          An educational estimate, not tax or religious advice. Confirm with a qualified
          CPA and your marja&apos; before acting.
        </li>
      </ul>
    </Disclosure>
  );
}
