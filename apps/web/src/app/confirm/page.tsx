"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useBatchStore } from "@/store/batch-store";

export default function ConfirmPage() {
  const router = useRouter();
  const { rows, batchId, setBatchId, setIdempotencyKey, setOperationId, applyExecutionResults } = useBatchStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rows.length === 0) { router.push("/"); return; }
    const defaultSelected = new Set(
      rows.filter((r) => r.status === "valid" || r.status === "warning").map((r) => r.client_row_id)
    );
    setSelectedIds(defaultSelected);
  }, [rows, router]);

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const sendableRows = rows.filter((r) => r.status === "valid" || r.status === "warning");
  const selectedRows = sendableRows.filter((r) => selectedIds.has(r.client_row_id));
  const totalAmount = selectedRows.reduce((sum, r) => sum + (r.amount_minor ?? 0), 0);
  const excluded = rows.length - selectedRows.length;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      let currentBatchId = batchId;
      if (!currentBatchId) {
        const validateRes = await fetch("/api/batch/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: selectedRows.map((r) => ({
              client_row_id: r.client_row_id,
              recipient_account: r.recipient_account,
              amount_minor: r.amount_minor,
              currency: r.currency,
              description: r.description,
            })),
          }),
        });
        const validateData = await validateRes.json();
        currentBatchId = validateData.batch_id;
        if (currentBatchId) setBatchId(currentBatchId);
      }

      const idempotencyKey = crypto.randomUUID();
      setIdempotencyKey(idempotencyKey);

      const executeRes = await fetch("/api/batch/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: currentBatchId,
          selected_row_ids: selectedRows.map((r) => r.client_row_id),
          idempotency_key: idempotencyKey,
        }),
      });

      const executeData = await executeRes.json();
      setOperationId(executeData.operation_id);
      applyExecutionResults(executeData.results);
      router.push("/result");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", padding: "2rem", fontFamily: "sans-serif", maxWidth: "700px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>Confirm Batch</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>Select which rows to include in this batch</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Selected payments", value: selectedRows.length },
          { label: "Total amount", value: (totalAmount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 }) },
          { label: "Excluded rows", value: excluded },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1rem" }}>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>{label}</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 600 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", marginBottom: "2rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["Include", "Account", "Amount", "Currency", "Description"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sendableRows.map((row, i) => (
              <tr key={row.client_row_id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6" }}>
                  <input type="checkbox" checked={selectedIds.has(row.client_row_id)} onChange={() => toggleRow(row.client_row_id)} />
                </td>
                <td style={{ padding: "8px 12px", fontSize: "0.8rem", borderBottom: "1px solid #f3f4f6" }}>{row.recipient_account}</td>
                <td style={{ padding: "8px 12px", fontSize: "0.8rem", borderBottom: "1px solid #f3f4f6" }}>{((row.amount_minor ?? 0) / 100).toFixed(2)}</td>
                <td style={{ padding: "8px 12px", fontSize: "0.8rem", borderBottom: "1px solid #f3f4f6" }}>{row.currency}</td>
                <td style={{ padding: "8px 12px", fontSize: "0.8rem", borderBottom: "1px solid #f3f4f6", color: row.description ? "#374151" : "#9ca3af" }}>
                  {row.description || "no description"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p style={{ color: "#dc2626", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</p>}

      <div style={{ display: "flex", gap: "1rem" }}>
        <button onClick={() => router.push("/review")} style={{ padding: "0.6rem 1.5rem", borderRadius: "8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer" }}>
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading || selectedRows.length === 0}
          style={{ padding: "0.6rem 1.5rem", borderRadius: "8px", border: "none", background: selectedRows.length > 0 && !loading ? "#6366f1" : "#d1d5db", color: "white", cursor: "pointer", fontWeight: 500 }}
        >
          {loading ? "Processing..." : "Confirm " + selectedRows.length + " payments"}
        </button>
      </div>
    </main>
  );
}
