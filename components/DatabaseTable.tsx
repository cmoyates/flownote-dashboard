"use client";

import React, {
  useMemo,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useDatabaseTableStore } from "@/stores/databaseTableStore";
import { NotionPage, NotionPagesResponse } from "@/types/notion";
import DatabaseTableRow from "./DatabaseTableRow";

const DatabaseTable = () => {
  const {
    activeDatabaseID,
    pages,
    isLoading,
    error,
    rowSelection,
    setPages,
    setIsLoading,
    setError,
    setRowSelection,
  } = useDatabaseTableStore();

  const [sorting, setSorting] = useState<SortingState>([]);

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragEndIndex, setDragEndIndex] = useState<number | null>(null);
  const dragStartSelection = useRef<Record<string, boolean>>({});
  const isMouseDown = useRef(false);

  // Fetch pages when active database changes
  useEffect(() => {
    if (!activeDatabaseID) return;

    const fetchPages = async () => {
      setIsLoading(true);
      setError(null);
      // Clear row selection when database changes
      setRowSelection({});

      try {
        const response = await fetch(
          `/api/notion/databases/${activeDatabaseID}/pages`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch pages");
        }

        const data: NotionPagesResponse = await response.json();
        setPages(data.pages);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPages();
  }, [activeDatabaseID, setPages, setIsLoading, setError, setRowSelection]);

  // Define columns with stable references
  const columns = useMemo<ColumnDef<NotionPage>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: (info) => (
          <div className="font-medium">
            {(info.getValue() as string) || "Untitled"}
          </div>
        ),
      },
      {
        accessorKey: "created_time",
        header: "Created",
        cell: (info) => (
          <div className="text-sm text-muted-foreground">
            {new Date(info.getValue() as string).toLocaleDateString()}
          </div>
        ),
      },
      {
        accessorKey: "last_edited_time",
        header: "Last Edited",
        cell: (info) => (
          <div className="text-sm text-muted-foreground">
            {new Date(info.getValue() as string).toLocaleDateString()}
          </div>
        ),
      },
      {
        accessorKey: "url",
        header: "Actions",
        cell: (info) => (
          <a
            href={info.getValue() as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            Open in Notion
          </a>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  // Create table instance
  const table = useReactTable({
    data: pages,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableSorting: true,
  });

  // Drag selection handlers
  const handleMouseDown = useCallback(
    (rowIndex: number, event: React.MouseEvent) => {
      // Prevent drag selection when clicking on checkboxes or links
      const target = event.target as HTMLElement;
      if (target.closest('input[type="checkbox"]') || target.closest("a")) {
        return;
      }

      // Handle Ctrl/Cmd + Click for individual toggle without drag
      if (event.ctrlKey || event.metaKey) {
        const row = table.getRowModel().rows[rowIndex];
        if (row) {
          row.toggleSelected();
        }
        return;
      }

      isMouseDown.current = true;
      setIsDragging(true);
      setDragStartIndex(rowIndex);
      setDragEndIndex(rowIndex);

      // Store the current selection state when starting drag
      dragStartSelection.current = { ...rowSelection };

      // Prevent text selection during drag
      event.preventDefault();
      document.body.style.userSelect = "none";
    },
    [rowSelection, table]
  );

  const handleMouseEnter = useCallback(
    (rowIndex: number) => {
      if (!isMouseDown.current || dragStartIndex === null) return;

      setDragEndIndex(rowIndex);
    },
    [dragStartIndex]
  );

  const handleMouseUp = useCallback(() => {
    if (
      !isMouseDown.current ||
      dragStartIndex === null ||
      dragEndIndex === null
    ) {
      isMouseDown.current = false;
      setIsDragging(false);
      return;
    }

    // Apply the drag selection
    const start = Math.min(dragStartIndex, dragEndIndex);
    const end = Math.max(dragStartIndex, dragEndIndex);

    const newSelection = { ...dragStartSelection.current };

    // Determine if we should select or deselect based on the first row in the range
    const firstRowInRange = table.getRowModel().rows[start];
    const shouldSelect = firstRowInRange
      ? !dragStartSelection.current[firstRowInRange.index]
      : true;

    // Apply the same action (select or deselect) to all rows in the range
    for (let i = start; i <= end; i++) {
      const row = table.getRowModel().rows[i];
      if (row) {
        newSelection[row.index] = shouldSelect;
      }
    }

    setRowSelection(newSelection);

    // Reset drag state and restore text selection
    isMouseDown.current = false;
    setIsDragging(false);
    setDragStartIndex(null);
    setDragEndIndex(null);
    dragStartSelection.current = {};
    document.body.style.userSelect = "";
  }, [dragStartIndex, dragEndIndex, setRowSelection, table]);

  // Global mouse up handler to handle mouse up outside the table
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDown.current) {
        handleMouseUp();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Cancel drag on Escape key
      if (event.key === "Escape" && isDragging) {
        isMouseDown.current = false;
        setIsDragging(false);
        setDragStartIndex(null);
        setDragEndIndex(null);
        dragStartSelection.current = {};
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
      // Cleanup on unmount
      document.body.style.userSelect = "";
    };
  }, [handleMouseUp, isDragging]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading pages...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  // No active database
  if (!activeDatabaseID) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">
          Please select a database to view its pages.
        </div>
      </div>
    );
  }

  // No pages found
  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">
          No pages found in this database.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      </div>

      <div
        className={`${
          isDragging ? "select-none cursor-grabbing" : "cursor-auto"
        }`}
      >
        <Table>
          <TableCaption>
            Pages from the selected Notion database ({pages.length} total)
          </TableCaption>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    <div
                      className={
                        header.column.getCanSort()
                          ? "cursor-pointer select-none hover:bg-muted/50 rounded p-1 -m-1"
                          : ""
                      }
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <span className="ml-1">
                          {{
                            asc: "↑",
                            desc: "↓",
                          }[header.column.getIsSorted() as string] ?? "↕"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row, index) => {
              const isInDragRange =
                isDragging &&
                dragStartIndex !== null &&
                dragEndIndex !== null &&
                index >= Math.min(dragStartIndex, dragEndIndex) &&
                index <= Math.max(dragStartIndex, dragEndIndex);

              return (
                <DatabaseTableRow
                  key={row.id}
                  row={row}
                  rowIndex={index}
                  isDragging={isDragging}
                  isInDragRange={isInDragRange}
                  onMouseDown={handleMouseDown}
                  onMouseEnter={handleMouseEnter}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DatabaseTable;
