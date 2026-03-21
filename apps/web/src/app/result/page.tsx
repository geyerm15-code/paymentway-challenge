"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBatchStore } from "@/store/batch-store";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  SUCCEEDED: { bg: "#dcfce7", color: "#16a34a" },
  FAILED:    { bg: "#fee2e2", color: "#dc2626" },
  UNKNOWN:   { bg: "#fef9c3", color: "#ca8a04" },
};

export default function ResultPage() {
  const router = useRouter();
  const { rows, operationId, reset } = useBatchStore();

  useEffect(() => {
    if (rows.length === 0) router.push("/");
  }, [rows, router]);

  const executed = rows.filter((r) => r.execution_status);
  const succeeded = executed.filter((r) => r.execution_status === "SUCCEEDED").length;
  const failed = executed.filter((r) => r.execution_status === "FAILED").length;
  const unknown = executed.filter((r) => r.execution_status === "UNKNOWN").length;
  const unknownRows = executed.filter((r) => r.execution_status === "UNKNOWN");

  const downloadReport = () => {
    const headers = ["account", "amount", "currency", "description", "status", "reference", "error"].join(",");
    const csvRows = executed.map((r) =>
      [r.recipient_account, (r.amount_minor ?? 0) / 100, r.currency, r.description, r.execution_status ?? "", r.external_reference ?? "", r.error_code ?? ""].join(",")
    );
    const blob = new Blob([[headers, ...csvRows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "batch-result.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main style={{ minHeight: "100vh", padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.25rem" }}>Batch Result</h1>
      {operationId && (
        <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "1.5rem" }}>Operation ID: {operationId}</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Succeeded", value: succeeded, bg: "#dcfce7", color: "#16a34a" },
          { label: "Failed", value: failed, bg: "#fee2e2", color: "#dc2626" },
          { label: "Unknown", value: unknown, bg: "#fef9c3", color: "#ca8a04" },
        ].map(({ label, value, bg, color }) => (
          <div key={label} style={{ background: bg, borderRadius: "8px", padding: "1rem" }}>
            <p style={{ fontSize: "0.75rem", color, marginBottom: "0.25rem", fontWeight: 500 }}>{label}</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color }}>{value}</p>
          </div>
        ))}
      </div>

      {unknown > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "8px", padding: "1rem", marginBottom: "2rem" }}>
          <p style={{ fontWeight: 600, color: "#92400e", marginBottom: "0.5rem" }}>
            Warning: {unknown} payment{unknown > 1 ? "s" : ""} with unknown status
          </p>
          <p style={{ fontSize: "0.875rem", color: "#78350f", marginBottom: "0.75rem" }}>
            We could not confirm if these payments were processed. This may happen due to network timeouts. 
            Do NOT retry without checking with your bank first — retrying may cause duplicate payments.
          </p>
          <ul style={{ fontSize: "0.8rem", color: "#92400e", paddingLeft: "1.25rem" }}>
            {unknownRows.map((r) => (
              <li key={r.client_row_id}>
                Account {r.recipient_account} — {((r.amount_minor ?? 0) / 100).toFixed(2)} {r.currency}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "auto", marginBottom: "2rem", maxHeight: "50vh" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", position: "sticky", top: 0 }}>
              {["Status", "Account", "Amount", "Currency", "Reference", "Error"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {executed.map((row, i) => {
              const s = row.execution_status ?? "UNKNOWN";
              return (
                <tr key={row.client_row_id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 500, padding: "2px 8px", borderRadius: "999px", background: STATUS_COLORS[s].bg, color: STATUS_COLORS[s].color }}>
                      {s}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", fontSize: "0.8rem", borderBottom: "1px solid #f3f4f6" }}>{row.recipient_account}</td>
                  <td style={{ padding: "8px 12px", fontSize: "0.8rem", borderBottom: "1px solid #f3f4f6" }}>{((row.amount_minor ?? 0) / 100).toFixed(2)}</td>
                  <td style={{ padding: "8px 12px", fontSize: "0.8rem", borderBottom: "1px solid #f3f4f6" }}>{row.currency}</td>
                  <td style={{ padding: "8px 12px", fontSize: "0.8rem", borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>{row.external_reference ?? "—"}</td>
                  <td style={{ padding: "8px 12px", fontSize: "0.8rem", borderBottom: "1px solid #f3f4f6", color: "#dc2626" }}>{row.error_code ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <button
          onClick={downloadReport}
          style={{ padding: "0.6rem 1.5rem", borderRadius: "8px", border: "1px solid #6366f1", background: "white", color: "#6366f1", cursor: "pointer", fontWeight: 500 }}
        >
          Download report
        </button>
        <button
          onClick={() => { reset(); router.push("/"); }}
          style={{ padding: "0.6rem 1.5rem", borderRadius: "8px", border: "none", background: "#6366f1", color: "white", cursor: "pointer", fontWeight: 500 }}
        >
          Upload new batch
        </button>
      </div>
    </main>
  );
}
