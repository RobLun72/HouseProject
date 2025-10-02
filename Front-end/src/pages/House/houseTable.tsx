"use client";

import type { ColumnDef, Row, SortingState } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { DataTable } from "../../components/ui/DataTable/DataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

import { PlusCircleIcon } from "@heroicons/react/24/outline";

import { useResponsive } from "@/helpers/useResponsive";
import { cn } from "@/lib/utils";
import type { House } from "./house";
import { useLocation } from "react-router-dom";

export function HouseTable({
  lists,
  onAdd,
  onEdit,
  onDelete,
  onViewRooms,
}: {
  lists: House[];
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onViewRooms: (index: number) => void;
  onUp: (index: number) => void;
  onDown: (index: number) => void;
}) {
  const { isMobile } = useResponsive();
  const page = useLocation();
  const searchParams = new URLSearchParams(page.search);
  const pageParams = { pagePath: page.pathname, params: searchParams };

  const handleAdd = () => {
    onAdd();
  };

  const pageParam = pageParams.params.get("page");
  const sortingParam = pageParams.params.get("sortBy");
  const directionParam = pageParams.params.get("direction");
  const sorting: SortingState = sortingParam
    ? [{ id: sortingParam, desc: directionParam === "desc" }]
    : [];

  return (
    <DataTable
      columns={GetColumns(isMobile, onEdit, onDelete, onViewRooms)}
      data={lists}
      addButtonText={
        <PlusCircleIcon className={cn(`h-8 cursor-pointer text-app-primary`)} />
      }
      filterColumnName="name"
      pageIndex={pageParam ? parseInt(pageParam) : 0}
      sortingState={sorting}
      pageSize={15}
      pageParams={pageParams}
      onAdd={handleAdd}
      dragDropEnabled={false}
    />
  );
}

function ContextMenu({
  row,
  onEdit,
  onDelete,
  onViewRooms,
}: {
  row: Row<House>;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onViewRooms: (index: number) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-12 w-12 bg-transparent p-0 float-end focus:outline-none group">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-6 mx-auto text-steel text-center w-6 group-focus:text-primary " />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuLabel>{row.original.name}</DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => onEdit(row.original.houseId)}
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => onDelete(row.original.houseId)}
        >
          Delete
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => onViewRooms(row.original.houseId)}
        >
          View Rooms
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GetColumns(
  isMobile: boolean,
  onEdit: (index: number) => void,
  onDelete: (index: number) => void,
  onViewRooms: (index: number) => void
): ColumnDef<House>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      size: isMobile ? 180 : 400,
      cell: ({ row }) => {
        return row.original.name;
      },
    },
    {
      accessorKey: "area",
      header: "Area",
      size: isMobile ? 30 : 60,
      cell: ({ row }) => {
        return row.original.area;
      },
    },
    {
      id: "actions",
      size: 50,
      maxSize: 50,
      cell: ({ row }) => {
        return ContextMenu({ row, onEdit, onDelete, onViewRooms });
      },
    },
  ];
}
