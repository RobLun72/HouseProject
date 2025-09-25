"use client";

import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { TableView } from "./TableDataView";

interface SimpleTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  activeRowIndex?: number;
  noRowsText?: string;
  onColumnClick?: (index: number) => void;
  onRowClick?: (index: number) => void;
}

const rowModels = {
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
};

export function SimpleTable<TData, TValue>({
  columns,
  data,
  activeRowIndex,
  noRowsText,
  onColumnClick,
  onRowClick,
}: SimpleTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: rowModels.getCoreRowModel,
  });

  return (
    <div className="">
      <TableView
        table={table}
        activeRowIndex={activeRowIndex}
        noRowsText={noRowsText}
        onColumnClick={onColumnClick}
        onRowClick={onRowClick}
      />
    </div>
  );
}
