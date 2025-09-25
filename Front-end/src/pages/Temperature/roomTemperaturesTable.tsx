"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "../../components/ui/DataTable/DataTable";
import { useResponsive } from "@/helpers/useResponsive";
import { useLocation } from "react-router-dom";
import type { Temperature } from "./houseTemperatures";

export function RoomTemperaturesTable({
  temperatures,
  roomName,
}: {
  temperatures: Temperature[];
  roomName: string;
}) {
  const { isMobile } = useResponsive();
  const page = useLocation();

  // Extract page parameter from URL for pagination
  const pageParams = {
    pagePath: page.pathname,
    params: new URLSearchParams(page.search),
  };
  const pageParam = pageParams.params.get("page");

  // Sorting state - sort by hour ascending by default
  const sorting: SortingState = [{ id: "hour", desc: false }];

  return (
    <DataTable
      columns={GetColumns(isMobile)}
      data={temperatures}
      addButtonText=""
      filterColumnName="hour"
      pageIndex={pageParam ? parseInt(pageParam) : 0}
      sortingState={sorting}
      pageParams={pageParams}
      showHeaderAndFooter={false}
      dragDropEnabled={false}
      noRowsText={`No temperature readings found for ${roomName} today.`}
    />
  );
}

function GetColumns(isMobile: boolean): ColumnDef<Temperature>[] {
  return [
    {
      accessorKey: "hour",
      header: "Hour",
      size: isMobile ? 60 : 80,
      cell: ({ row }) => {
        const hour = row.original.hour;
        // Format hour to 12-hour format
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour < 12 ? "AM" : "PM";
        return `${displayHour}:00 ${period}`;
      },
    },
    {
      accessorKey: "degrees",
      header: "Temperature",
      size: isMobile ? 100 : 120,
      cell: ({ row }) => {
        return `${row.original.degrees.toFixed(1)}°F`;
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      size: isMobile ? 100 : 120,
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        return date.toLocaleDateString();
      },
    },
  ];
}
