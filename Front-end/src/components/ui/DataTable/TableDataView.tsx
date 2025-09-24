"use client";

import { type Table as TableCore } from "@tanstack/table-core";
import { flexRender } from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

interface TableViewProps<TData> {
  table: TableCore<TData>;
  activeRowIndex?: number;
  noRowsText?: string;
  dragDropEnabled?: boolean;
  dragDropFromClassName?: string;
  dragDropToClassName?: string;
  onColumnClick?: (index: number) => void;
  onRowClick?: (index: number) => void;
  onRowDrop?: (fromIndex: number, toIndex: number) => void;
}

export function TableView<TData>({
  table,
  activeRowIndex,
  noRowsText,
  dragDropEnabled = false,
  dragDropFromClassName,
  dragDropToClassName,
  onColumnClick,
  onRowClick,
  onRowDrop,
}: TableViewProps<TData>) {
  return (
    <Table className="lg:text-sm text-xs">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead
                  key={header.id}
                  style={{
                    width: `${header.getSize()}px`,
                    minWidth: `${header.getSize()}px`,
                  }}
                  onClick={() => onColumnClick && onColumnClick(header.index)}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody dragDropEnabled={dragDropEnabled}>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              onClick={() => onRowClick && onRowClick(row.index)}
              className={
                activeRowIndex === row.index ? "bg-neutral-100" : "bg-appWhite"
              } // Highlight active row
              dragDropEnabled={dragDropEnabled}
              dragDropId={row.index}
              dragDropFromClassName={dragDropFromClassName}
              dragDropToClassName={dragDropToClassName}
              onRowDrop={(fromIndex: number, toIndex: number) =>
                onRowDrop && onRowDrop(fromIndex, toIndex)
              }
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} style={{ width: `50px` }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={table.getAllColumns().length}
              className="h-24 text-center"
            >
              {noRowsText ?? "No results."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
