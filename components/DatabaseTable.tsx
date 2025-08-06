"use client";

import React, { useMemo, useEffect, useState } from "react";
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
import { useDatabaseTableStore } from "@/stores/databaseTableStore";
import { NotionPage, NotionPagesResponse } from "@/types/notion";
import DatabaseTableRow from "./DatabaseTableRow";

const DatabaseTable = () => {
  const {
    activeDatabaseID,
    pages,
    isLoading,
    error,
    setPages,
    setIsLoading,
    setError,
  } = useDatabaseTableStore();

  const [sorting, setSorting] = useState<SortingState>([]);

  // Fetch pages when active database changes
  useEffect(() => {
    if (!activeDatabaseID) return;

    const fetchPages = async () => {
      setIsLoading(true);
      setError(null);

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
  }, [activeDatabaseID, setPages, setIsLoading, setError]);

  // Define columns with stable references
  const columns = useMemo<ColumnDef<NotionPage>[]>(
    () => [
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
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    enableSorting: true,
  });

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
        {table.getRowModel().rows.map((row) => (
          <DatabaseTableRow key={row.id} row={row} />
        ))}
      </TableBody>
    </Table>
  );
};

export default DatabaseTable;
