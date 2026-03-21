import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

const processedBatches = new Map<string, object>();

export async function POST(request: Request) {
  const { batch_id, selected_row_ids, idempotency_key } = (await request.json()) as {
    batch_id: string;
    selected_row_ids: string[];
    idempotency_key: string;
  };

  if (processedBatches.has(idempotency_key)) {
    return NextResponse.json(processedBatches.get(idempotency_key));
  }

  await new Promise((r) => setTimeout(r, 1200));

  const results = selected_row_ids.map((id, index) => {
    let status: "SUCCEEDED" | "FAILED" | "UNKNOWN";

    if (index === 2 || index === 7) {
      status = "UNKNOWN";
    } else if (index % 6 === 0 && index !== 0) {
      status = "FAILED";
    } else {
      status = "SUCCEEDED";
    }

    return {
      client_row_id: id,
      status,
      external_reference:
        status === "SUCCEEDED" ? `TXN-${nanoid(8).toUpperCase()}` : undefined,
      error_code: status === "FAILED" ? "INSUFFICIENT_FUNDS" : undefined,
    };
  });

  const response = {
    operation_id: `op_${nanoid()}`,
    submitted_at: new Date().toISOString(),
    results,
  };

  processedBatches.set(idempotency_key, response);

  return NextResponse.json(response);
}
