"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useBatchStore, type BatchRow, type RowStatus } from "@/store/batch-store";
import { buildAndValidateRows } from "@/lib/row-validator";

const STATUS_COLORS: Record<RowStatus, { bg: string; color: string }> = {
  valid:     { bg: "#dcfce7", color: "#16a34a" },
  warning:   { bg: "#fef9c3", color: "#ca8a04" },
  error:     { bg: "#fee2e2", color: "#dc2626" },
  duplicate: { bg: "#ffedd5", color: "#ea580c" },
};

export default function ReviewPage() {
  const router = useRouter();
  const { rows, setRows, columnMapping } = useBatchStore();
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof BatchRow } | null>(null);
  const [editValue, setEditValue] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rows.length === 0) router.push("/");
  }, [rows, router]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const handleEdit = (row: BatchRow, field: keyof BatchRow) => {
    setEditingCell({ id: row.client_row_id, field });
    setEditValue(String(row[field] ?? ""));
  };

  const handleSave = () => {
    if (!editingCell) return;
    const updated = rows.map((r) =>
      r.client_row_id === editingCell.id ? { ...r, [editingCell.field]: editValue } : r
    );
    const revalidated = buildAndValidateRows(
      updated.map((r) => ({
        recipient_account: r.recipient_account,
        amount: r.amount_minor !== null ? String(r.amount_minor / 100) : editingCell.field === "amount_minor" ? editValue : "",
        currency: r.currency,
        description: r.description,
      }))
    ).map((r, i) => ({ ...r, client_row_id: updated[i].client_row_id }));
    setRows(revalidated);
    setEditingCell(null);
  };

  const counts = {
    valid: rows.filter((r) => r.status === "valid").length,
    warning: rows.filter((r) => r.status === "warning").length,
    error: rows.filter((r) => r.status === "error").length,
    duplicate: rows.filter((r) => r.status === "duplicate").length,
  };

  const canProceed = counts.valid + counts.warning > 0;

  return (
    <main style={{ minHeight: "100vh", padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>Review Payments</h1>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {(Object.entries(counts) as [RowStatus, number][]).map(([status, count]) => (
          <div key={status} style={{ padding: "0.4rem 0.9rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 500, background: STATUS_COLORS[status].bg, color: STATUS_COLORS[status].color }}>
            {count} {status}
          </div>
        ))}
        <div style={{ padding: "0.4rem 0.9rem", borderRadius: "999px", fontSize: "0.8rem", background: "#f3f4f6", color: "#374151" }}>
          {rows.length} total rows
        </div>
      </div>

      <div ref={parentRef} style={{ height: "60vh", overflow: "auto", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead style={{ position: "sticky", top: 0, background: "white", zIndex: 1 }}>
              <tr>
                {["Status", "Account", "Amount (cents)", "Currency", "Description", "Errors"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, color: "#374151", borderBottom: "2px solid #e5e7eb", background: "#f9fafb" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                const isEditing = (field: keyof BatchRow) =>
                  editingCell?.id === row.client_row_id && editingCell?.field === field;
                return (
                  <tr
                    key={row.client_row_id}
                    style={{
                      position: "absolute", top: `${virtualRow.start}px`, width: "100%",
                      display: "table", tableLayout: "fixed",
                      background: virtualRow.index % 2 === 0 ? "white" : "#fafafa",
                    }}
                  >
                    <td style={{ padding: "8px 12px", width: "100px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, padding: "2px 8px", borderRadius: "999px", background: STATUS_COLORS[row.status].bg, color: STATUS_COLORS[row.status].color }}>
                        {row.status}
                      </span>
                    </td>
                    {(["recipient_account", "amount_minor", "currency", "description"] as (keyof BatchRow)[]).map((field) => (
                      <td key={field} style={{ padding: "4px 8px", cursor: "pointer" }} onDoubleClick={() => handleEdit(row, field)}>
                        {isEditing(field) ? (
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditingCell(null); }}
                            style={{ width: "100%", padding: "4px", border: "2px solid #6366f1", borderRadius: "4px", fontSize: "0.8rem" }}
                          />
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#374151" }}>{String(row[field] ?? "")}</span>
                        )}
                      </td>
                    ))}
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ fontSize: "0.7rem", color: "#dc2626" }}>{row.errors.join(", ")}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.5rem" }}>
        Double-click any cell to edit inline
      </p>

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
