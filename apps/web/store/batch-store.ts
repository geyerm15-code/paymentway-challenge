import { create } from "zustand";

export type RowStatus = "valid" | "warning" | "error" | "duplicate";

export interface BatchRow {
  client_row_id: string;
  recipient_account: string;
  amount_minor: number | null;
  currency: string;
  description: string;
  status: RowStatus;
  errors: string[];
  server_status?: "valid" | "invalid" | "unknown_account";
  execution_status?: "SUCCEEDED" | "FAILED" | "UNKNOWN";
  external_reference?: string;
  error_code?: string;
}

interface BatchState {
  rawRows: Record<string, string>[];
  columnMapping: Record<string, string | undefined>;
  rows: BatchRow[];
  batchId: string | null;
  idempotencyKey: string | null;
  operationId: string | null;
  setRawRows: (rows: Record<string, string>[]) => void;
  setColumnMapping: (mapping: Record<string, string | undefined>) => void;
  setRows: (rows: BatchRow[]) => void;
  updateRow: (id: string, patch: Partial<BatchRow>) => void;
  setBatchId: (id: string) => void;
  setIdempotencyKey: (key: string) => void;
  setOperationId: (id: string) => void;
  applyExecutionResults: (results: Array<{
    client_row_id: string;
    status: "SUCCEEDED" | "FAILED" | "UNKNOWN";
    external_reference?: string;
    error_code?: string;
  }>) => void;
  reset: () => void;
}

export const useBatchStore = create<BatchState>((set) => ({
  rawRows: [],
  columnMapping: {},
  rows: [],
  batchId: null,
  idempotencyKey: null,
  operationId: null,
  setRawRows: (rawRows) => set({ rawRows }),
  setColumnMapping: (columnMapping) => set({ columnMapping }),
  setRows: (rows) => set({ rows }),
  updateRow: (id, patch) =>
    set((state) => ({
      rows: state.rows.map((r) =>
        r.client_row_id === id ? { ...r, ...patch } : r
      ),
    })),
  setBatchId: (batchId) => set({ batchId }),
  setIdempotencyKey: (idempotencyKey) => set({ idempotencyKey }),
  setOperationId: (operationId) => set({ operationId }),
  applyExecutionResults: (results) =>
    set((state) => ({
      rows: state.rows.map((row) => {
        const result = results.find((r) => r.client_row_id === row.client_row_id);
        if (!result) return row;
        return {
          ...row,
          execution_status: result.status,
          external_reference: result.external_reference,
          error_code: result.error_code,
        };
      }),
    })),
  reset: () =>
    set({
      rawRows: [],
      columnMapping: {},
      rows: [],
      batchId: null,
      idempotencyKey: null,
      operationId: null,
    }),
}));
