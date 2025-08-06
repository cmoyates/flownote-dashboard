import React from "react";
import { type Table } from "@tanstack/react-table";
import { NotionPage } from "@/types/notion";
import DatabaseTableRow from "./DatabaseTableRow";

interface DatabaseTableBodyRowsProps {
  table: Table<NotionPage>;
  isDragging: boolean;
  dragRange: { start: number; end: number } | null;
  onMouseDown: (rowIndex: number, event: React.MouseEvent) => void;
  onMouseEnter: (rowIndex: number) => void;
}

const DatabaseTableBodyRows = React.memo<DatabaseTableBodyRowsProps>(
  ({ table, isDragging, dragRange, onMouseDown, onMouseEnter }) => {
    const rows = table.getRowModel().rows;

    return (
      <>
        {rows.map((row, index) => {
          const isInDragRange = dragRange
            ? index >= dragRange.start && index <= dragRange.end
            : false;

          return (
            <DatabaseTableRow
              key={row.id}
              row={row}
              rowIndex={index}
              isDragging={isDragging}
              isInDragRange={isInDragRange}
              onMouseDown={onMouseDown}
              onMouseEnter={onMouseEnter}
            />
          );
        })}
      </>
    );
  }
);

// Add display name for better debugging
DatabaseTableBodyRows.displayName = "DatabaseTableBodyRows";

export default DatabaseTableBodyRows;
