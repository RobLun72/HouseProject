import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUpDown } from "lucide-react";
import { useCallback } from "react";
import cn from "../../../helpers/cn";

interface TableSortingButtonProps<T> {
  text: string;
  column: Column<T, unknown>;
  pageParams?: { pagePath: string; params: URLSearchParams };
  onSortChange?: (newSort: string) => void;
}
export function TableSortingButton<T>({
  text,
  column,
  pageParams,
  onSortChange,
}: TableSortingButtonProps<T>) {
  const handleClick = useCallback(() => {
    if (!pageParams) {
      return ``;
    }
    let newParamString = "?";
    pageParams.params.forEach((value, key) => {
      if (key !== "sortBy" && key !== "direction") {
        newParamString += `${key}=${value}&`;
      } else if (key === "sortBy") {
        newParamString += `${key}=${column.id}&`;
      } else if (key === "direction") {
        newParamString += `${key}=${
          column.getIsSorted() === "asc" ? "desc" : "asc"
        }&`;
      }
    });
    if (!newParamString.includes("sortBy")) {
      newParamString += `sortBy=${column.id}&direction=asc&`;
    }

    if (onSortChange) {
      onSortChange(`${pageParams.pagePath}${newParamString}`);
    }

    column.toggleSorting(column.getIsSorted() === "asc");
  }, [column, pageParams, onSortChange]);

  const sorted = column.getIsSorted();
  return (
    <button
      className="flex gap-2 rounded-none py-1 outline-offset-4 outline-stone px-0 bg-transparent hover:text-primary focus:text-primary"
      onClick={handleClick}
    >
      <span className={cn("", sorted && "text-primary")}>{text}</span>

      <div className="flex items-center justify-center gap-0">
        {sorted === false ? (
          <ArrowUpDown key="arrow" className="h-4 w-4 transition-all" />
        ) : (
          <ArrowDown
            key="arrow"
            className={cn(
              "h-4 w-4 transition-transform",
              sorted === "desc" && "-scale-y-100",
              sorted && "text-primary"
            )}
          />
        )}
      </div>
    </button>
  );
}
