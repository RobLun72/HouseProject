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
import { useResponsive } from "@/helpers/useResponsive";
import { useLocation } from "react-router-dom";
import type { Room } from "./houseTemperatures";

export function HouseTemperaturesTable({
  lists,
  houseName,
  onRoomTemp,
}: {
  lists: Room[];
  houseName: string;
  onRoomTemp: (houseId: number, roomId: number) => void;
}) {
  const { isMobile } = useResponsive();
  const page = useLocation();

  // Extract page parameter from URL for pagination
  const pageParams = {
    pagePath: page.pathname,
    params: new URLSearchParams(page.search),
  };
  const pageParam = pageParams.params.get("page");

  // Sorting state
  const sorting: SortingState = [{ id: "name", desc: false }];

  return (
    <DataTable
      columns={GetColumns(isMobile, onRoomTemp)}
      data={lists}
      addButtonText=""
      filterColumnName="name"
      pageIndex={pageParam ? parseInt(pageParam) : 0}
      sortingState={sorting}
      pageParams={pageParams}
      showHeaderAndFooter={false}
      dragDropEnabled={false}
      noRowsText={`No rooms found in ${houseName}.`}
    />
  );
}

function ContextMenu({
  row,
  onRoomTemp,
}: {
  row: Row<Room>;
  onRoomTemp: (houseId: number, roomId: number) => void;
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
          onClick={() => onRoomTemp(row.original.houseId, row.original.roomId)}
        >
          View todays temperatures
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GetColumns(
  isMobile: boolean,
  onRoomTemp: (houseId: number, roomId: number) => void
): ColumnDef<Room>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      size: isMobile ? 120 : 200,
      cell: ({ row }) => {
        return row.original.name;
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      size: isMobile ? 80 : 150,
      cell: ({ row }) => {
        return row.original.type;
      },
    },
    {
      accessorKey: "area",
      header: "Area (sq ft)",
      size: isMobile ? 80 : 120,
      cell: ({ row }) => {
        return row.original.area.toLocaleString();
      },
    },
    {
      accessorKey: "placement",
      header: "Placement",
      size: isMobile ? 100 : 150,
      cell: ({ row }) => {
        return row.original.placement;
      },
    },
    {
      id: "actions",
      size: 50,
      maxSize: 50,
      cell: ({ row }) => {
        return ContextMenu({ row, onRoomTemp });
      },
    },
  ];
}
