#!/usr/bin/env node
/**
 * Refreshes the inflation-indexed figures in data/federal_tax.json.
 *
 * Build-time / CI only. The app never fetches anything in the browser, and no
 * API key is involved: the source is a plain public JSON document.
 *
 *   node scripts/update-tax-data.mjs                 strict (CI): fail loudly
 *   node scripts/update-tax-data.mjs --soft          build: never fail, keep committed data
 *   node scripts/update-tax-data.mjs --file x.json   read the source from disk
 *   node scripts/update-tax-data.mjs --dry-run       validate and report, write nothing
 *   node scripts/update-tax-data.mjs --force         skip the year and drift guards
 *
 * Source: $TAX_DATA_SOURCE_URL (or --file). The document is a partial copy of
 * data/federal_tax.json — only these keys are read, everything else is ignored:
 *
 *   tax_year, source,
 *   ordinary_income_tax.filing_statuses.<status>.{standard_deduction, brackets}
 *   long_term_capital_gains_and_qualified_dividends.filing_statuses.<status>.brackets
 *   self_employment_tax.social_security_wage_base            (optional)
 *
 * Statutory figures (NIIT, Additional Medicare, Social Security benefit tiers,
 * rates, the CTC) are deliberately NOT updated here: they are not indexed
 * annually, and changing them is a legislative edit that deserves a human.
 */
import { readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_FILE = path.join(ROOT, "data", "federal_tax.json");

const STATUSES = ["single", "married_joint", "head_of_household", "married_separate"];
/** A year-over-year move bigger than this is a bad source, not inflation. */
const MAX_DRIFT = 0.15;

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const SOFT = flag("--soft");
const DRY = flag("--dry-run");
const FORCE = flag("--force");

class SkipError extends Error {}

// ------------------------------------------------------------------ source

async function loadSource() {
  const file = option("--file");
  if (file) return JSON.parse(await readFile(path.resolve(file), "utf8"));

  const url = process.env.TAX_DATA_SOURCE_URL;
  if (!url) {
    throw new SkipError(
      "No source configured (set TAX_DATA_SOURCE_URL or pass --file); keeping committed data.",
    );
  }
  if (!/^https:\/\//.test(url)) throw new Error("TAX_DATA_SOURCE_URL must be https.");

  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Source responded ${res.status} ${res.statusText}.`);
  return res.json();
}

// -------------------------------------------------------------- validation
// Mirrors FederalTaxData in lib/types.ts. The compile-time half of that check
// is lib/federalTaxData.check.ts, run by `tsc --noEmit` after this script.

const isNum = (n) => typeof n === "number" && Number.isFinite(n);

function validateBrackets(brackets, where, { rateMax = 1 } = {}) {
  const errors = [];
  if (!Array.isArray(brackets) || brackets.length === 0) {
    return [`${where}: brackets must be a non-empty array`];
  }
  brackets.forEach((b, i) => {
    const at = `${where}[${i}]`;
    if (!isNum(b?.rate) || b.rate < 0 || b.rate > rateMax) errors.push(`${at}: bad rate`);
    if (!isNum(b?.min) || b.min < 0) errors.push(`${at}: bad min`);
    if (b?.max !== null && !isNum(b?.max)) errors.push(`${at}: max must be a number or null`);
    if (i === 0 && b?.min !== 0) errors.push(`${at}: first bracket must start at 0`);
    if (i > 0) {
      const prev = brackets[i - 1];
      if (!(b.rate > prev.rate)) errors.push(`${at}: rates must strictly increase`);
      if (prev.max === null || b.min !== prev.max + 1) {
        errors.push(`${at}: min must be previous max + 1 (IRS table convention)`);
      }
    }
    if (isNum(b?.max) && isNum(b?.min) && b.max <= b.min) errors.push(`${at}: max <= min`);
    if (b?.max === null && i !== brackets.length - 1) errors.push(`${at}: only the last bracket is open-ended`);
  });
  if (brackets.at(-1)?.max !== null) errors.push(`${where}: last bracket must be open-ended`);
  return errors;
}

function validateSource(src) {
  const errors = [];
  if (!Number.isInteger(src?.tax_year) || src.tax_year < 2020 || src.tax_year > 2100) {
    errors.push("tax_year must be a plausible integer year");
  }
  if (typeof src?.source !== "string" || src.source.trim() === "") {
    errors.push("source must name the Revenue Procedure it came from");
  }

  for (const status of STATUSES) {
    const ord = src?.ordinary_income_tax?.filing_statuses?.[status];
    if (!ord) {
      errors.push(`ordinary_income_tax.${status} missing`);
    } else {
      if (!isNum(ord.standard_deduction) || ord.standard_deduction <= 0) {
        errors.push(`ordinary_income_tax.${status}.standard_deduction invalid`);
      }
      errors.push(...validateBrackets(ord.brackets, `ordinary.${status}`));
    }

    const cg =
      src?.long_term_capital_gains_and_qualified_dividends?.filing_statuses?.[status];
    if (!cg) errors.push(`long_term_capital_gains.${status} missing`);
    else errors.push(...validateBrackets(cg.brackets, `capital_gains.${status}`));
  }

  const base = src?.self_employment_tax?.social_security_wage_base;
  if (base !== undefined && (!isNum(base) || base <= 0)) {
    errors.push("self_employment_tax.social_security_wage_base invalid");
  }
  return errors;
}

/** Guards against a plausible-looking but wrong source (units, wrong year). */
function checkAgainstCurrent(current, next) {
  const errors = [];
  if (next.tax_year < current.tax_year) {
    errors.push(`source is for ${next.tax_year}, older than the committed ${current.tax_year}`);
    return errors;
  }

  const drift = (a, b, what) => {
    if (a > 0 && Math.abs(b - a) / a > MAX_DRIFT) {
      errors.push(`${what} moved ${a} -> ${b} (>${MAX_DRIFT * 100}%)`);
    }
  };
  for (const status of STATUSES) {
    const a = current.ordinary_income_tax.filing_statuses[status];
    const b = next.ordinary_income_tax.filing_statuses[status];
    drift(a.standard_deduction, b.standard_deduction, `${status} standard deduction`);
    if (a.brackets.length === b.brackets.length) {
      a.brackets.forEach((x, i) => {
        if (x.max !== null) drift(x.max, b.brackets[i].max, `${status} bracket ${i + 1}`);
      });
    }
  }
  return errors;
}

// ------------------------------------------------------------------ merge

function merge(current, src) {
  const next = structuredClone(current);
  next.tax_year = src.tax_year;
  next.source = src.source;

  for (const status of STATUSES) {
    const target = next.ordinary_income_tax.filing_statuses[status];
    const from = src.ordinary_income_tax.filing_statuses[status];
    target.standard_deduction = from.standard_deduction;
    target.brackets = from.brackets.map(({ rate, min, max }) => ({ rate, min, max }));

    next.long_term_capital_gains_and_qualified_dividends.filing_statuses[status].brackets =
      src.long_term_capital_gains_and_qualified_dividends.filing_statuses[status].brackets.map(
        ({ rate, min, max }) => ({ rate, min, max }),
      );
  }

  const base = src.self_employment_tax?.social_security_wage_base;
  if (base !== undefined) next.self_employment_tax.social_security_wage_base = base;
  return next;
}

/** 2-space JSON, but one line per bracket so diffs stay readable. */
function serialize(data) {
  return (
    JSON.stringify(data, null, 2).replace(
      /\{\s*"rate": ([\d.]+),\s*"min": (\d+),\s*"max": (\d+|null)\s*\}/g,
      '{ "rate": $1, "min": $2, "max": $3 }',
    ) + "\n"
  );
}

// ------------------------------------------------------------------- main

async function main() {
  const current = JSON.parse(await readFile(DATA_FILE, "utf8"));
  const src = await loadSource();

  const errors = validateSource(src);
  if (errors.length) throw new Error(`Source failed validation:\n  - ${errors.join("\n  - ")}`);

  if (!FORCE) {
    const guard = checkAgainstCurrent(current, src);
    if (guard.length) throw new Error(`Source failed sanity checks:\n  - ${guard.join("\n  - ")}`);
  }

  const next = merge(current, src);
  if (isDeepStrictEqual(current, next)) {
    console.log(`federal_tax.json already current (tax year ${current.tax_year}).`);
    return;
  }

  if (DRY) {
    console.log(`[dry-run] would update ${current.tax_year} -> ${next.tax_year}.`);
    return;
  }
  await writeFile(DATA_FILE, serialize(next), "utf8");
  console.log(`Updated data/federal_tax.json: ${current.tax_year} -> ${next.tax_year}.`);
}

main().catch((error) => {
  if (error instanceof SkipError) {
    console.log(error.message);
    return;
  }
  console.error(`update-tax-data: ${error.message}`);
  // In --soft mode (npm run build) a flaky network must never break a deploy.
  if (SOFT) {
    console.error("update-tax-data: --soft, keeping committed data.");
    return;
  }
  process.exitCode = 1;
});
