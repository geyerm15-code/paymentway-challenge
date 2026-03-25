"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBatchStore } from "@/store/batch-store";
import { DataTable } from "@/components/data-table/data-table";
import { paymentColumns } from "@/components/data-table/payment-columns";

export default function ReviewPage() {
  const router = useRouter();
  const { rows } = useBatchStore();

  useEffect(() => {
    if (rows.length === 0) router.push("/");
  }, [rows, router]);

  const counts = {
    valid: rows.filter((r) => r.status === "valid").length,
    warning: rows.filter((r) => r.status === "warning").length,
    error: rows.filter((r) => r.status === "error").length,
    duplicate: rows.filter((r) => r.status === "duplicate").length,
  };

  const canProceed = counts.valid + counts.warning > 0;

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>Review Payments</h1>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {(Object.entries(counts) as [string, number][]).map(([status, count]) => (
          <div key={status} style={{ padding: "0.4rem 0.9rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 500, background: "#f3f4f6", color: "#374151" }}>
            {count} {status}
          </div>
        ))}
        <div style={{ padding: "0.4rem 0.9rem", borderRadius: "999px", fontSize: "0.8rem", background: "#e0e7ff", color: "#3730a3" }}>
          {rows.length} total
        </div>
      </div>
      <DataTable columns={paymentColumns} data={rows} />
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
        <button onClick={() => router.push("/mapping")} style={{ padding: "0.6rem 1.5rem", borderRadius: "8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer" }}>
          Back
        </button>
        <button
          onClick={() => router.push("/confirm")}
          disabled={!canProceed}
          style={{ padding: "0.6rem 1.5rem", borderRadius: "8px", border: "none", background: canProceed ? "#6366f1" : "#d1d5db", color: "white", cursor: canProceed ? "pointer" : "not-allowed", fontWeight: 500 }}
        >
          Continue to Confirm
        </button>
      </div>
    </main>
  );
}
