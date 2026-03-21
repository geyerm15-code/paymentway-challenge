"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useBatchStore } from "@/store/batch-store";
import { autoDetectMapping } from "@/lib/column-mapper";

export default function UploadPage() {
  const router = useRouter();
  const { setRawRows, setColumnMapping } = useBatchStore();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      const isCsv = file.name.endsWith(".csv");
      const isXlsx = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

      if (!isCsv && !isXlsx) {
        setError("Only .csv and .xlsx files are supported");
        return;
      }

      if (isCsv) {
        Papa.parse<Record<string, string>>(file, {
          header: true,
          skipEmptyLines: "greedy",
          complete: (result) => {
            const rows = result.data;
            const columns = Object.keys(rows[0] ?? {});
            const mapping = autoDetectMapping(columns);
            setRawRows(rows);
            setColumnMapping(mapping);
            router.push("/mapping");
          },
          error: () => setError("Failed to parse CSV file"),
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const wb = XLSX.read(e.target?.result, { type: "binary" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
              defval: "",
            });
            const columns = Object.keys(rows[0] ?? {});
            const mapping = autoDetectMapping(columns);
            setRawRows(rows);
            setColumnMapping(mapping);
            router.push("/mapping");
          } catch {
            setError("Failed to parse XLSX file");
          }
        };
        reader.readAsBinaryString(file);
      }
    },
    [router, setRawRows, setColumnMapping]
  );

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>Batch Payment Upload</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>Upload a .csv or .xlsx file to process multiple payments at once</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file) processFile(file); }}
        style={{
          width: "100%", maxWidth: "480px", border: `2px dashed ${dragging ? "#6366f1" : "#d1d5db"}`,
          borderRadius: "12px", padding: "3rem 2rem", textAlign: "center",
          background: dragging ? "#eef2ff" : "#fafafa", transition: "all 0.2s", cursor: "pointer",
        }}
      >
        <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>📂</p>
        <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>Drag and drop your file here</p>
        <p style={{ color: "#999", fontSize: "0.875rem", marginBottom: "1.5rem" }}>or</p>
        <label style={{ background: "#6366f1", color: "white", padding: "0.6rem 1.5rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem" }}>
          Browse file
          <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (file) processFile(file); }} />
        </label>
      </div>

      {error && (
        <p style={{ marginTop: "1rem", color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>
      )}

      <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "#999" }}>
        Need a sample file?{" "}
        <a href="/sample-batch.csv" style={{ color: "#6366f1" }}>Download example</a>
      </p>
    </main>
  );
}
