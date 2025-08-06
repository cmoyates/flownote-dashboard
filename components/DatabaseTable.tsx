"use client";

import { useEffect, useState, useRef, useMemo, useCallback, memo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { useDatabaseTableStore } from "@/stores/databaseTableStore";
import { NotionPage, NotionPagesResponse } from "@/types/notion";
import DatabaseTableBodyRows from "./DatabaseTableBodyRows";

// Memoized cell components
const TitleCell = memo(({ value }: { value: string | null }) => (
  <div className="font-medium">{value || "Untitled"}</div>
));
TitleCell.displayName = "TitleCell";

const DateCell = memo(({ value }: { value: string }) => (
  <div className="text-sm text-muted-foreground">
    {new Date(value).toLocaleDateString()}
  </div>
));
DateCell.displayName = "DateCell";

const ActionCell = memo(({ url }: { url: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 hover:text-blue-800 text-sm underline"
  >
    Open in Notion
  </a>
));
ActionCell.displayName = "ActionCell";

// Static state components
const LoadingState = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-muted-foreground">Loading pages...</div>
  </div>
);

const ErrorState = ({ error }: { error: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-red-600">Error: {error}</div>
  </div>
);

const EmptyDatabaseState = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-muted-foreground">
      Please select a database to view its pages.
    </div>
  </div>
);

const NoDataState = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-muted-foreground">
      No pages found in this database.
    </div>
  </div>
);

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

  // Memoized columns definition (stable reference)
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
        cell: (info) => <TitleCell value={info.getValue() as string} />,
      },
      {
        accessorKey: "created_time",
        header: "Created",
        cell: (info) => <DateCell value={info.getValue() as string} />,
      },
      {
        accessorKey: "last_edited_time",
        header: "Last Edited",
        cell: (info) => <DateCell value={info.getValue() as string} />,
      },
      {
        accessorKey: "url",
        header: "Actions",
        cell: (info) => <ActionCell url={info.getValue() as string} />,
        enableSorting: false,
      },
    ],
    []
  );

  // Memoized table options for stable reference
  const tableOptions = useMemo(
    () => ({
      data: pages,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      enableRowSelection: true,
      state: {
        sorting,
        rowSelection,
      },
      onSortingChange: setSorting,
      onRowSelectionChange: setRowSelection,
      enableSorting: true,
      initialState: {
        pagination: {
          pageSize: 50,
        },
      },
    }),
    [pages, columns, sorting, rowSelection, setRowSelection]
  );

  // Create table instance
  const table = useReactTable(tableOptions);

  // Memoized selection text
  const selectionText = useMemo(() => {
    if (!table) return "0 of 0 row(s) selected.";

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const totalRows = table.getFilteredRowModel().rows;

    return `${selectedRows.length} of ${totalRows.length} row(s) selected.`;
  }, [table]);

  // Memoized drag selection handlers for stable references
  const handleMouseDown = useCallback(
    (rowIndex: number, event: React.MouseEvent) => {
      const tableRows = table?.getRowModel().rows ?? [];

      // Prevent drag selection when clicking on checkboxes or links
      const target = event.target as HTMLElement;
      if (target.closest('input[type="checkbox"]') || target.closest("a")) {
        return;
      }

      // Handle Ctrl/Cmd + Click for individual toggle without drag
      if (event.ctrlKey || event.metaKey) {
        const row = tableRows[rowIndex];
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
    [table, rowSelection]
  );

  const handleMouseEnter = useCallback(
    (rowIndex: number) => {
      if (!isMouseDown.current || dragStartIndex === null) return;

      setDragEndIndex(rowIndex);
    },
    [dragStartIndex]
  );

  // Memoized drag range calculations
  const dragRange = useMemo(() => {
    if (!isDragging || dragStartIndex === null || dragEndIndex === null) {
      return null;
    }
    return {
      start: Math.min(dragStartIndex, dragEndIndex),
      end: Math.max(dragStartIndex, dragEndIndex),
    };
  }, [isDragging, dragStartIndex, dragEndIndex]);

  // Global mouse up handler to handle mouse up outside the table
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (!isMouseDown.current) return;

      if (dragStartIndex === null || dragEndIndex === null) {
        isMouseDown.current = false;
        setIsDragging(false);
        return;
      }

      // Get current table rows
      const currentTableRows = table?.getRowModel().rows ?? [];

      // Calculate drag range
      const start = Math.min(dragStartIndex, dragEndIndex);
      const end = Math.max(dragStartIndex, dragEndIndex);

      const newSelection = { ...dragStartSelection.current };

      // Determine if we should select or deselect based on the first row in the range
      const firstRowInRange = currentTableRows[start];
      const shouldSelect = firstRowInRange
        ? !dragStartSelection.current[firstRowInRange.index]
        : true;

      // Apply the same action (select or deselect) to all rows in the range
      for (let i = start; i <= end; i++) {
        const row = currentTableRows[i];
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
  }, [isDragging, dragStartIndex, dragEndIndex, setRowSelection, table]);

  // Early returns with memoized components
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!activeDatabaseID) {
    return <EmptyDatabaseState />;
  }

  if (pages.length === 0) {
    return <NoDataState />;
  }

  return (
    <div className="space-y-4 flex-1 h-full w-full">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{selectionText}</div>
      </div>

      <ScrollArea className="h-full w-full rounded-md border">
        <div
          className={isDragging ? "select-none cursor-grabbing" : "cursor-auto"}
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
              <DatabaseTableBodyRows
                table={table}
                isDragging={isDragging}
                dragRange={dragRange}
                rowSelection={rowSelection}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
              />
            </TableBody>
          </Table>
        </div>
      </ScrollArea>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <select
            className="h-8 w-[70px] rounded border border-input bg-transparent px-2 text-sm"
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {[5, 10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            «
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ‹
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            ›
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            »
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseTable;
