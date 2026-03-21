import { parseAmountToMinor } from "./amount-parser";
import type { BatchRow, RowStatus } from "@/store/batch-store";
import { nanoid } from "nanoid";

const VALID_CURRENCIES = new Set(["COP", "USD", "EUR"]);
const MAX_AMOUNT_MINOR = 10_000_000_00;
const MAX_DESCRIPTION_LENGTH = 140;

type RawInput = {
  recipient_account: string;
  amount: string;
  currency: string;
  description: string;
};

/**
 * Maps raw CSV/XLSX rows to BatchRow objects and assigns validation status.
 * Receives ALL rows at once to detect duplicates across the full batch.
 *
 * @param inputs - Rows already mapped to system field names
 * @returns Validated BatchRow array with status and errors
 */
export function buildAndValidateRows(inputs: RawInput[]): BatchRow[] {
  const amountByInput = inputs.map((r) => parseAmountToMinor(r.amount));

  const dupeCounter = new Map<string, number>();
  for (let i = 0; i < inputs.length; i++) {
    const key = `${inputs[i].recipient_account.trim()}|${amountByInput[i]}`;
    dupeCounter.set(key, (dupeCounter.get(key) ?? 0) + 1);
  }

  return inputs.map((input, i): BatchRow => {
    const errors: string[] = [];
    const amount_minor = amountByInput[i];

    if (!input.recipient_account?.trim()) errors.push("Missing recipient account");
    if (amount_minor === null) errors.push("Invalid amount format");
    if (amount_minor !== null && amount_minor <= 0) errors.push("Amount must be positive");
    if (amount_minor !== null && amount_minor > MAX_AMOUNT_MINOR)
      errors.push("Amount exceeds limit");
    if (!VALID_CURRENCIES.has(input.currency?.toUpperCase()))
      errors.push("Currency must be COP, USD or EUR");
    if (input.description?.length > MAX_DESCRIPTION_LENGTH)
      errors.push(`Description exceeds ${MAX_DESCRIPTION_LENGTH} chars`);

    const dupeKey = `${input.recipient_account.trim()}|${amount_minor}`;
    let status: RowStatus;

    if (dupeCounter.get(dupeKey)! > 1) {
      status = "duplicate";
    } else if (errors.length > 0) {
      status = "error";
    } else if (!input.description?.trim()) {
      status = "warning";
    } else {
      status = "valid";
    }

    return {
      client_row_id: nanoid(),
      recipient_account: input.recipient_account?.trim() ?? "",
      amount_minor,
      currency: input.currency?.toUpperCase() ?? "",
      description: input.description ?? "",
      status,
      errors,
    };
  });
}
