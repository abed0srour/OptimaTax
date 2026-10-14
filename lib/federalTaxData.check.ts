import federal2025Json from "@/data/federal_tax_2025.json";
import federal2026Json from "@/data/federal_tax_2026.json";
import type { FederalTaxData } from "./types";

/**
 * Compile-time guard: `tsc --noEmit` fails here if a data/federal_tax_<year>.json
 * (e.g. after scripts/update-tax-data.mjs) stops matching FederalTaxData.
 */
export const federal2025MatchesTypes: FederalTaxData = federal2025Json;
export const federal2026MatchesTypes: FederalTaxData = federal2026Json;
