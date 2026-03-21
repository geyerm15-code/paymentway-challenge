import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

interface ValidateRequestRow {
  client_row_id: string;
  recipient_account: string;
  amount_minor: number;
  currency: string;
  description: string;
}

function simulateAccountCheck(account: string): "valid" | "unknown_account" {
  return account.startsWith("9") ? "unknown_account" : "valid";
}

export async function POST(request: Request) {
  const { rows } = (await request.json()) as { rows: ValidateRequestRow[] };

  await new Promise((r) => setTimeout(r, 600));

  const results = rows.map((row) => {
    const accountStatus = simulateAccountCheck(row.recipient_account);
    return {
      client_row_id: row.client_row_id,
      server_status: accountStatus,
      error_code: accountStatus === "unknown_account" ? "ACCOUNT_NOT_FOUND" : undefined,
      error_detail:
        accountStatus === "unknown_account"
          ? `Account ${row.recipient_account} not found in the banking system`
          : undefined,
    };
  });

  return NextResponse.json({ batch_id: nanoid(), rows: results });
}
