"use client";

import * as React from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";

import { cn } from "@/lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

export interface TableBodyProps extends React.ComponentProps<"tbody"> {
  dragDropEnabled?: boolean;
}

function TableBody({ className, dragDropEnabled, ...props }: TableBodyProps) {
  const ref = React.useRef<HTMLTableElement | null>(null);
  React.useEffect(() => {
    if (!ref.current) return;
    if (!dragDropEnabled) {
      // If drag and drop is not enabled, we don't need to set up the auto-scroll
      return;
    }
    const cleanup = combine(
      autoScrollForElements({
        element: ref.current,
      })
    );
    return cleanup;
  }, [dragDropEnabled]);

  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

export interface DraggableRowProps extends React.ComponentProps<"tr"> {
  dragDropId: number;
  dragDropFromClassName?: string;
  dragDropToClassName?: string;
  onRowDrop?: (fromIndex: number, toIndex: number) => void;
}

function DragggableTableRow({
  className,
  dragDropId,
  dragDropFromClassName,
  dragDropToClassName,
  onRowDrop,
  ...props
}: DraggableRowProps) {
  const ref = React.useRef<HTMLTableRowElement | null>(null);
  const itemId = dragDropId;
  const [dragDropState, setDragDropState] = React.useState<boolean>(false);
  const [isDraggedOver, setIsDraggedOver] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!ref.current) return;

    const cleanup = combine(
      draggable({
        element: ref.current,
        getInitialData: () => ({ type: "row", itemId: itemId }),
        onDragStart: () => setDragDropState(true),
        onDrop: () => setDragDropState(false),
      }),
      dropTargetForElements({
        element: ref.current,
        getData: () => ({ type: "row", itemId: itemId }),
        canDrop: (args) => args.source.data.type === "row",
        onDragEnter: () => setIsDraggedOver(true),
        onDragLeave: () => setIsDraggedOver(false),
        onDrop: ({ source, location }) => {
          const destination = location.current.dropTargets[0];
          if (!destination) {
            // if dropped outside of any drop targets
            return;
          }
          setIsDraggedOver(false);
          if (onRowDrop) {
            onRowDrop(
              Number(source.data.itemId),
              Number(destination.data.itemId)
            );
          }
        },
      })
    );
    return cleanup;
  }, [itemId, onRowDrop]);

  return (
    <tr
      ref={ref}
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
        dragDropState ? dragDropFromClassName : "",
        isDraggedOver ? dragDropToClassName : ""
      )}
      {...props}
    />
  );
}

function DefaultTableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props}
    />
  );
}

export interface TableRowProps extends React.ComponentProps<"tr"> {
  dragDropEnabled?: boolean;
  dragDropId?: number;
  dragDropFromClassName?: string;
  dragDropToClassName?: string;
  onRowDrop?: (fromIndex: number, toIndex: number) => void;
}

function TableRow({
  className,
  dragDropId,
  dragDropFromClassName,
  dragDropToClassName,
  dragDropEnabled,
  onRowDrop,
  ...props
}: TableRowProps) {
  if (dragDropEnabled) {
    return (
      <DragggableTableRow
        className={className}
        dragDropId={dragDropId!}
        dragDropFromClassName={dragDropFromClassName}
        dragDropToClassName={dragDropToClassName}
        onRowDrop={onRowDrop}
        {...props}
      />
    );
  } else {
    return <DefaultTableRow className={className} {...props} />;
  }
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium  break-words [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle break-words [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
