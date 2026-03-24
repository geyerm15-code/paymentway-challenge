"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { BatchRow, RowStatus } from "@/store/batch-store";
import { DataTableColumnHeader } from "./data-table-column-header";

const STATUS_COLORS: Record<RowStatus, { bg: string; color: string }> = {
  valid:     { bg: "#dcfce7", color: "#16a34a" },
  warning:   { bg: "#fef9c3", color: "#ca8a04" },
  error:     { bg: "#fee2e2", color: "#dc2626" },
  duplicate: { bg: "#ffedd5", color: "#ea580c" },
};

export const paymentColumns: ColumnDef<BatchRow>[] = [
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue<RowStatus>("status");
      const colors = STATUS_COLORS[status];
      return (
        <span style={{ fontSize: "0.75rem", fontWeight: 500, padding: "2px 8px", borderRadius: "999px", background: colors.bg, color: colors.color }}>
          {status}
        </span>
      );
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "recipient_account",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Account" />,
    cell: ({ row }) => <span style={{ fontSize: "0.8rem" }}>{row.getValue("recipient_account")}</span>,
  },
  {
    accessorKey: "amount_minor",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => {
      const amount = row.getValue<number | null>("amount_minor");
      return <span style={{ fontSize: "0.8rem" }}>{amount !== null ? (amount / 100).toFixed(2) : "—"}</span>;
    },
  },
  {
    accessorKey: "currency",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Currency" />,
    cell: ({ row }) => <span style={{ fontSize: "0.8rem" }}>{row.getValue("currency")}</span>,
  },
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => {
      const desc = row.getValue<string>("description");
      return <span style={{ fontSize: "0.8rem", color: desc ? "#374151" : "#9ca3af" }}>{desc || "no description"}</span>;
    },
  },
  {
    accessorKey: "errors",
    header: "Errors",
    cell: ({ row }) => {
      const errors = row.getValue<string[]>("errors");
      return <span style={{ fontSize: "0.7rem", color: "#dc2626" }}>{errors.join(", ")}</span>;
    },
  },
];
