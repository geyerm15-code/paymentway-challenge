"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useBatchStore } from "@/store/batch-store";
import { SYSTEM_FIELDS, type SystemField } from "@/lib/column-mapper";
import { buildAndValidateRows } from "@/lib/row-validator";

export default function MappingPage() {
  const router = useRouter();
  const { rawRows, columnMapping, setColumnMapping, setRows } = useBatchStore();
  const [localMapping, setLocalMapping] = useState<Record<string, string | undefined>>(columnMapping);

  useEffect(() => {
    if (rawRows.length === 0) router.push("/");
  }, [rawRows, router]);

  const userColumns = Object.keys(rawRows[0] ?? {});

  const handleChange = (field: SystemField, value: string) => {
    setLocalMapping((prev) => ({ ...prev, [field]: value || undefined }));
  };

  const handleContinue = () => {
    setColumnMapping(localMapping);
    const inputs = rawRows.map((row) => ({
      recipient_account: row[localMapping.recipient_account ?? ""] ?? "",
      amount: row[localMapping.amount ?? ""] ?? "",
      currency: row[localMapping.currency ?? ""] ?? "",
      description: row[localMapping.description ?? ""] ?? "",
    }));
    const validated = buildAndValidateRows(inputs);
    setRows(validated);
    router.push("/review");
  };

  const requiredMapped = SYSTEM_FIELDS.filter((f) => f !== "description").every(
    (f) => localMapping[f]
  );

  return (
    <main style={{ minHeight: "100vh", padding: "2rem", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>Map Columns</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Match your file columns to the required system fields
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {SYSTEM_FIELDS.map((field) => {
          const isRequired = field !== "description";
          const isAutoDetected = !!columnMapping[field];
          return (
            <div key={field} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <label style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                  {field} {isRequired && <span style={{ color: "#dc2626" }}>*</span>}
                </label>
                {isAutoDetected && (
                  <span style={{ fontSize: "0.75rem", color: "#16a34a", background: "#dcfce7", padding: "0.1rem 0.5rem", borderRadius: "999px" }}>
                    Auto-detected
                  </span>
                )}
              </div>
              <select
                value={localMapping[field] ?? ""}
                onChange={(e) => handleChange(field, e.target.value)}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.875rem", background: "white" }}
              >
                <option value="">— Select column —</option>
                {userColumns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <button
          onClick={() => router.push("/")}
          style={{ padding: "0.6rem 1.5rem", borderRadius: "8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer" }}
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!requiredMapped}
          style={{
            padding: "0.6rem 1.5rem", borderRadius: "8px", border: "none",
            background: requiredMapped ? "#6366f1" : "#d1d5db",
            color: "white", cursor: requiredMapped ? "pointer" : "not-allowed", fontWeight: 500,
          }}
        >
          Continue to Review
        </button>
      </div>
    </main>
  );
}
