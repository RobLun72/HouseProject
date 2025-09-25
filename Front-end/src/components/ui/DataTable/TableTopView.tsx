import type { Table as TableCore } from "@tanstack/table-core";
import { Input } from "../input";
import type { ReactNode } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../select";

interface TableTopViewProps<TData> {
  table: TableCore<TData>;
  addButtonText: ReactNode;
  filterColumnName?: string;
  pageSize?: string;
  onAdd?: () => void;
  onPageSizeChange?: (size: string) => void;
}

export function TableTopView<TData>({
  table,
  addButtonText,
  filterColumnName,
  pageSize = "50",
  onAdd,
  onPageSizeChange,
}: TableTopViewProps<TData>) {
  return (
    <div className="flex py-4 gap-2 justify-between ">
      {filterColumnName && (
        <Input
          placeholder={
            filterColumnName
              ? "Filter " + filterColumnName + "..."
              : "Filter by..."
          }
          value={
            (table.getColumn(filterColumnName)?.getFilterValue() as string) ??
            ""
          }
          onChange={(event) =>
            table
              .getColumn(filterColumnName)
              ?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      )}
      <div className="flex flex-row-reverse w-full">
        <Select defaultValue={pageSize} onValueChange={onPageSizeChange}>
          <SelectTrigger className="w-[65px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="7">7</SelectItem>
            <SelectItem value="15">15</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div
        className="ml-auto flex items-center"
        onClick={onAdd}
        data-testid="table-add-button"
      >
        {addButtonText}
      </div>
    </div>
  );
}
