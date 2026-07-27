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
- **State tax types** — 9 states with no income tax, 13 flat-rate states, 29 graduated jurisdictions (including DC).

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

`state_tax.json` keys brackets and standard deductions by filing status, with a `default` entry as the fallback:

```jsonc
{
  "code": "MT",
  "name": "Montana",
  "tax_type": "graduated",
  "standard_deduction": { "single": 15750, "married_joint": 31500, ... },
  "brackets": {
    "default":       [{ "rate": 0.047, "min": 0, "max": 21100 }, ...],
    "married_joint": [{ "rate": 0.047, "min": 0, "max": 42200 }, ...]
  }
}
```

Lookup is `brackets[filing_status] ?? brackets.default`. A `max` of `null` marks the open-ended top bracket. An `allows_charitable_deduction: false` flag means a donation produces no state-level saving.

### The engine

`lib/tax.ts` is pure and side-effect free — safe to run on every keystroke.

```ts
calculateProgressiveTax(taxableIncome, brackets) // walks brackets chunk by chunk
calculateFederalTax(taxableIncome, status)       // reads federal_tax.json
calculateStateTax(taxableIncome, state, status)  // dispatches on tax_type
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
| Federal taxable income | $84,250 | $64,250 |
| Federal tax | $13,449 | $9,049 |
| California tax | $5,327 | $3,467 |
| **Total tax** | **$18,776** | **$12,516** |

Tax saved: **$6,260**. Real cost of the $20,000 gift: **$13,740** — an effective 31.3% discount.

---

## Scope and limitations

This is an educational estimator, not tax or religious advice.

- **Ordinary income only.** No payroll or self-employment tax, AMT, net investment income tax, QBI deduction, capital gains rates, credits, or deduction phaseouts.
- **State income tax only.** City and county income taxes are excluded — NYC and Yonkers, Maryland counties, Ohio municipalities, Indiana counties, Pennsylvania local EIT.
- **Personal exemptions and state-specific credits are not modeled.** Where a state uses exemptions instead of a standard deduction (IL, IN, MA, MI), the exemption amount fills the standard-deduction slot and is noted in the data file.
- **Tax year 2025** rates throughout, per IRS Rev. Proc. 2024-40 and state revenue department schedules.
- **Khums rulings vary by school and marja'.** The tool computes the common 1/5 of annual surplus. It does not rule on whether a given 501(c)(3) is a valid recipient of sahm al-imam or sahm al-sada — that is a question for your marja', and under many rulings a US charity is *not* a valid recipient of the imam's share.

Confirm anything consequential with a qualified CPA.
