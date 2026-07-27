const wholeDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const centsDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const grouped = new Intl.NumberFormat("en-US");

export function formatCurrency(value: number, showCents = false): string {
  if (!Number.isFinite(value)) return "$0";
  return showCents ? centsDollars.format(value) : wholeDollars.format(value);
}

/** Signed currency, e.g. "+$4,120" / "−$780". Uses a real minus sign. */
export function formatSignedCurrency(value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) return formatCurrency(0);
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${formatCurrency(Math.abs(value))}`;
}

/** `0.0685` → `"6.85%"`. */
export function formatPercent(rate: number, digits = 2): string {
  if (!Number.isFinite(rate)) return "0%";
  return `${(rate * 100).toFixed(digits)}%`;
}

/** Trims trailing zeros: `0.05` → `"5%"`, `0.0575` → `"5.75%"`. */
export function formatRate(rate: number): string {
  const pct = rate * 100;
  const text = pct.toFixed(4).replace(/\.?0+$/, "");
  return `${text || "0"}%`;
}

/** Reads a user-typed money string ("1,234.56") back into a number. */
export function parseMoney(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Normalizes raw keystrokes into a grouped money string as the user types:
 * drops junk characters, keeps a single decimal point, caps at two decimals,
 * and comma-groups the integer part.
 */
export function formatMoneyInput(text: string): string {
  const digitsAndDots = text.replace(/[^0-9.]/g, "");
  if (digitsAndDots === "") return "";

  const [head, ...rest] = digitsAndDots.split(".");
  const hasDecimal = rest.length > 0;
  const decimals = rest.join("").slice(0, 2);

  const intPart = head.replace(/^0+(?=\d)/, "");
  const groupedInt = grouped.format(Number(intPart || "0"));

  return hasDecimal ? `${groupedInt}.${decimals}` : groupedInt;
}

/** Turns a number back into the input's display string. */
export function toMoneyInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return formatMoneyInput(String(Math.round(value * 100) / 100));
}

/** Bracket range label, e.g. "$11,925 – $48,475" or "$626,350 and up". */
export function formatBracketRange(min: number, max: number | null): string {
  return max === null
    ? `${formatCurrency(min)} and up`
    : `${formatCurrency(min)} – ${formatCurrency(max)}`;
}
