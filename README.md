# OptimaTax

A client-side US tax visualizer, legal donation optimizer, and Islamic *khums* integration calculator.

Enter your income, expenses, and planned charitable gift, and OptimaTax shows two scenarios side by side — what you owe if you keep everything, and what you owe if you route your khums obligation through a 501(c)(3). Every figure recalculates as you type. No server, no API, no data leaves the browser.

---

## What it does

**Net profit** — `Total income − operating expenses`, floored at zero. This is the pool everything else sits on.

**Khums** — one fifth (20%) of net profit, with a tracker showing how much of the obligation your donation covers, what remains outstanding, and how much you are giving beyond it as voluntary sadaqah.

**Scenario A (no donation)** — federal and state tax on `net profit − standard deduction`.

**Scenario B (donation `x`)** — the same, with the charitable gift deducted before tax. Both scenarios include a chunk-by-chunk bracket walkthrough, so you can see exactly which slice of income was taxed at which rate.

**Optimization metrics** — the tax saved, the real out-of-pocket cost of the gift, and the effective discount the tax code applies to every donated dollar. A stacked bar shows how the same net profit splits between the government, the charity, and you under each scenario.

### Two deduction models

The dashboard has a **Stacked / IRS itemization** toggle, because the two produce materially different numbers:

| Mode | Federal deduction | Notes |
| --- | --- | --- |
| **Stacked** (default) | `standard deduction + donation` | The formula specified in the project brief. Simple to reason about, and generous. |
| **IRS itemization** | `max(standard deduction, donation)` | The actual federal rule under IRC §63(b) — you take the greater of the standard deduction or your itemized total, never both. Gifts smaller than the standard deduction produce no additional benefit. |

For figures that match what you would actually file, use **IRS itemization**.

### Accuracy guardrails already modeled

- **60% AGI ceiling** on cash gifts to public charities (IRC §170(b)(1)(A)). Anything above it is excluded from this year's deduction and flagged as a five-year carryforward.
- **States that allow no charitable deduction** — CT, IL, IN, MI, NJ, OH, PA, RI, WV. There, the donation lowers the federal bill only, and the UI says so.
- **State tax types** — 9 states with no income tax, 15 flat-rate states, 27 graduated jurisdictions (including DC).
- **Bracket boundary normalization** — see below.

### Bracket boundaries

Both JSON files list brackets the way the IRS prints them, with each `min` one dollar above the previous `max`:

```jsonc
{ "rate": 0.10, "min": 0,     "max": 12400 },
{ "rate": 0.12, "min": 12401, "max": 50400 }
```

Read literally, the dollar between 12,400 and 12,401 is taxed by neither bracket. `normalizeBrackets()` in [lib/taxData.ts](lib/taxData.ts) snaps each `min` down to the previous `max`, turning the schedule into contiguous half-open `[min, max)` ranges before the engine ever sees it. The effect is small but real — about $0.58 on a $200,000 single return — and it is what makes the output match IRS tables to the cent.

Keep the source files in IRS convention. Values can then be pasted straight from a Revenue Procedure without adjustment.

---

## Project structure

```
├── app/
│   ├── layout.tsx            Root layout, fonts, metadata
│   ├── page.tsx              The dashboard (client component)
│   └── globals.css           Tailwind v4 entry + a few utilities
├── components/
│   ├── Card.tsx              Card shell, header, label/value row
│   ├── Field.tsx             Select and currency inputs
│   ├── StatTile.tsx          Headline stat tiles
│   ├── ScenarioCard.tsx      One tax scenario, end to end
│   ├── BracketTable.tsx      Chunk-by-chunk bracket audit trail
│   ├── KhumsPanel.tsx        Khums obligation vs. donation tracker
│   └── Optimization.tsx      Savings banner + allocation bars
├── data/
│   ├── federal_tax.json      Filing statuses, standard deductions, brackets
│   └── state_tax.json        50 states + DC by tax_type: none | flat | graduated
└── lib/
    ├── types.ts              Shared types for the data files and results
    ├── taxData.ts            Typed imports + lookup helpers
    ├── tax.ts                The calculation engine (pure functions)
    └── format.ts             Currency, percent, and input formatting
```

### Data file shape

`federal_tax.json` nests each filing status under `ordinary_income_tax.filing_statuses`, and additionally carries long-term capital gains brackets, NIIT thresholds, Additional Medicare Tax thresholds, and the personal exemption. Only the ordinary-income section and the charitable ceiling are wired into the dashboard today; the rest is typed and loadable but unused.

`state_tax.json` is an object keyed by postal code, holding **single-filer schedules only**:

```jsonc
"MT": {
  "name": "Montana",
  "tax_type": "graduated",
  "brackets": [
    { "rate": 0.047, "min": 0,     "max": 20500 },
    { "rate": 0.0565, "min": 20501, "max": null }
  ]
}
```

A `max` of `null` marks the open-ended top bracket. `none` states carry `rate: 0.0` and no brackets; `flat` states carry a `rate` and no brackets.

The dataset has no per-status state brackets and no state standard deductions, so [lib/taxData.ts](lib/taxData.ts) resolves each raw entry into a `StateTaxEntry` — adding the postal code, normalizing brackets, and attaching an `allowsCharitableDeduction` flag. That flag lives in code rather than in the JSON because it is a statutory fact, not an annually-adjusted rate.

### The engine

`lib/tax.ts` is pure and side-effect free — safe to run on every keystroke.

```ts
calculateProgressiveTax(taxableIncome, brackets) // walks brackets chunk by chunk
calculateFederalTax(taxableIncome, status)       // reads federal_tax.json
calculateStateTax(taxableIncome, state)          // dispatches on tax_type
calculateNetProfit(income, expenses)             // floored at zero
calculateKhums(netProfit, donation)              // 1/5 obligation + coverage
buildComparison(input)                           // both scenarios + metrics
```

Flat-rate states are modeled as a one-bracket schedule, so flat and graduated states share the same result shape and the same breakdown UI.

---

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

Requires Node 18.18+.

### Worked example

California · single · income $120,000 · expenses $20,000 · donation $20,000 · stacked mode:

| | Scenario A | Scenario B |
| --- | --- | --- |
| Federal taxable income | $83,900 | $63,900 |
| Federal tax | $13,170 | $8,770 |
| California tax | $5,842 | $3,982 |
| **Total tax** | **$19,012** | **$12,752** |

Tax saved: **$6,260**. Real cost of the $20,000 gift: **$13,740** — an effective 31.3% discount.

---

## Scope and limitations

This is an educational estimator, not tax or religious advice.

- **Ordinary income only.** No payroll or self-employment tax, AMT, QBI deduction, credits, or deduction phaseouts. The data file now carries long-term capital gains brackets, the 3.8% NIIT, and the 0.9% Additional Medicare Tax, but the dashboard does not apply them.
- **State brackets are single-filer schedules, applied to every filing status.** The dataset carries no married-filing-jointly thresholds, which are wider in many states — joint filers will see state tax overstated.
- **No state standard deductions or exemptions.** The dataset omits them, so state taxable income is the full net profit less any deductible gift. Real state bills will generally be lower.
- **State income tax only.** City and county income taxes are excluded — NYC and Yonkers, Maryland counties, Ohio municipalities, Indiana counties, Pennsylvania local EIT.
- **Tax year 2026** throughout: federal per IRS Rev. Proc. 2025-32, state schedules per the accompanying dataset.
- **Two OBBBA charitable provisions effective 2026 are not modeled** — the new 0.5%-of-AGI floor on itemized charitable deductions, and the 35% cap on itemized deduction value for top-bracket filers. Both would reduce the savings shown.
- **Khums rulings vary by school and marja'.** The tool computes the common 1/5 of annual surplus. It does not rule on whether a given 501(c)(3) is a valid recipient of sahm al-imam or sahm al-sada — that is a question for your marja', and under many rulings a US charity is *not* a valid recipient of the imam's share.

Confirm anything consequential with a qualified CPA.
