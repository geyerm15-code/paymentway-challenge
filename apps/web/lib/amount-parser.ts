/**
 * Converts any freeform amount string to integer minor units (cents).
 *
 * Supported formats:
 *  "1500"       -> 150000
 *  "1.500"      -> 150000  (European thousands)
 *  "1,500.00"   -> 150000  (US format)
 *  "1.500,00"   -> 150000  (European decimal comma)
 *  "$1,500"     -> 150000  (currency symbol)
 *  "1500.5"     -> 150050
 *
 * @param raw - Raw string from CSV/XLSX cell
 * @returns Amount in minor units (integer cents), or null if unparseable
 */
export function parseAmountToMinor(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,]/g, "").trim();
  if (!cleaned) return null;

  let normalized: string;

  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(cleaned)) {
    normalized = cleaned.replace(/,/g, "");
  } else if (/^\d+([.,]\d{1,2})?$/.test(cleaned)) {
    normalized = cleaned.replace(",", ".");
  } else {
    return null;
  }

  const value = parseFloat(normalized);
  if (Number.isNaN(value) || value < 0) return null;

  return Math.round(value * 100);
}
