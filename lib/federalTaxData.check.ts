import federalJson from "@/data/federal_tax.json";
import type { FederalTaxData } from "./types";

/**
 * Compile-time guard: `tsc --noEmit` fails here if data/federal_tax.json
 * (e.g. after scripts/update-tax-data.mjs) stops matching FederalTaxData.
 */
export const federalTaxDataMatchesTypes: FederalTaxData = federalJson;
