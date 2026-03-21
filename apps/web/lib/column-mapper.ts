export const SYSTEM_FIELDS = [
  "recipient_account",
  "amount",
  "currency",
  "description",
] as const;

export type SystemField = (typeof SYSTEM_FIELDS)[number];

const ALIASES: Record<SystemField, string[]> = {
  recipient_account: ["account", "cuenta", "cbu", "recipient", "destino", "to", "cuentadestino"],
  amount:            ["amount", "monto", "valor", "importe", "value", "total"],
  currency:          ["currency", "moneda", "cur", "coin"],
  description:       ["description", "descripcion", "concepto", "ref", "reference", "detail", "nota"],
};

/**
 * Fuzzy auto-detects which user column corresponds to each system field.
 * Strips spaces/underscores/dashes and lowercases before comparing.
 *
 * @param userColumns - Column names found in the uploaded file
 * @returns Map of system field -> user column name (undefined if not found)
 */
export function autoDetectMapping(
  userColumns: string[]
): Record<SystemField, string | undefined> {
  const mapping = {} as Record<SystemField, string | undefined>;
  for (const field of SYSTEM_FIELDS) {
    mapping[field] = userColumns.find((col) => {
      const normalized = col.toLowerCase().replace(/[\s_\-]/g, "");
      return ALIASES[field].some((alias) => normalized.includes(alias));
    });
  }
  return mapping;
}
