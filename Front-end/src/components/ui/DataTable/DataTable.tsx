"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { Fragment, type ReactNode, useState } from "react";
import { TableFooter } from "./TableFooter";
import { TableTopView } from "./TableTopView";
import { TableView } from "./TableDataView";

interface DataTableProps<TData, TValue> {
  showHeaderAndFooter?: boolean;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  addButtonText: ReactNode;
  filterColumnName?: string;
  /**
   * Number of rows per page.
   *
   * @default 5
   */
  pageSize?: 5 | 7 | 15 | 25 | 50;
  pageIndex?: number;
  sortingState?: SortingState;
  pageParams?: { pagePath: string; params: URLSearchParams };
  onAdd?: () => void;
  onColumnClick?: (index: number) => void;
  onRowClick?: (index: number) => void;
  activeRowIndex?: number;
  noRowsText?: string;
  borderClasses?: string;
  dragDropEnabled?: boolean;
  dragDropFromClassName?: string;
  dragDropToClassName?: string;
  onRowDrop?: (fromIndex: number, toIndex: number) => void;
}

const rowModels = {
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
};

export function DataTable<TData, TValue>({
  showHeaderAndFooter = true,
  columns,
  data,
  addButtonText,
  filterColumnName = "name",
  pageSize = 50,
  pageIndex = 0,
  sortingState = [],
  pageParams,
  onAdd,
  onColumnClick,
  onRowClick,
  activeRowIndex,
  noRowsText = "No results.",
  borderClasses = "rounded-sm border",
  dragDropEnabled = false,
  dragDropFromClassName = "bg-blue-300",
  dragDropToClassName = "bg-blue-100",
  onRowDrop,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(sortingState);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: pageIndex,
    pageSize: pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: rowModels.getCoreRowModel,
    getPaginationRowModel: rowModels.getPaginationRowModel,
    onSortingChange: setSorting,
    getSortedRowModel: rowModels.getSortedRowModel,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: rowModels.getFilteredRowModel,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    defaultColumn: {
      size: 50, //starting column size
    },
  });

  const onPageSizeChange = (size: string) => {
    const newPageSize = parseInt(size, 10);
    setPagination({
      pageIndex: 0, // Reset to first page when changing page size
      pageSize: newPageSize,
    });
  };

  return (
    <Fragment>
      {showHeaderAndFooter && (
        <TableTopView
          table={table}
          pageSize={pageSize.toString()}
          filterColumnName={filterColumnName}
          addButtonText={addButtonText}
          onAdd={onAdd}
          onPageSizeChange={onPageSizeChange}
        />
      )}
      <div className={borderClasses}>
        <TableView
          table={table}
          activeRowIndex={activeRowIndex}
          onColumnClick={onColumnClick}
          onRowClick={onRowClick}
          noRowsText={noRowsText}
          dragDropEnabled={dragDropEnabled}
          dragDropFromClassName={dragDropFromClassName}
          dragDropToClassName={dragDropToClassName}
          onRowDrop={onRowDrop}
        />
      </div>
      {showHeaderAndFooter && (
        <TableFooter table={table} pageParams={pageParams!} />
      )}
    </Fragment>
  );
}
