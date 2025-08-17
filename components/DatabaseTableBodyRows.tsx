import { MouseEvent, memo } from "react";
import { type Table } from "@tanstack/react-table";
import { NotionPage } from "@/types/notion";
import DatabaseTableRow from "./DatabaseTableRow";

interface DatabaseTableBodyRowsProps {
  table: Table<NotionPage>;
  isDragging: boolean;
  dragRange: { start: number; end: number } | null;
  rowSelection: Record<string, boolean>;
  onMouseDown: (rowIndex: number, event: MouseEvent) => void;
  onMouseEnter: (rowIndex: number) => void;
  // Pass through pages array ref to invalidate React.memo when data changes
  dataRef: NotionPage[];
}

const DatabaseTableBodyRows = memo(
  ({
    table,
    isDragging,
    dragRange,
    rowSelection,
    onMouseDown,
    onMouseEnter,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dataRef,
  }: DatabaseTableBodyRowsProps) => {
    const rows = table.getRowModel().rows;

    // Create drag range set for faster lookups
    const dragRangeSet = new Set<number>();
    if (dragRange) {
      for (let i = dragRange.start; i <= dragRange.end; i++) {
        dragRangeSet.add(i);
      }
    }

    return (
      <>
        {rows.map((row, index) => (
          <DatabaseTableRow
            key={row.id}
            row={row}
            rowIndex={index}
            isSelected={Boolean(rowSelection[row.index])}
            isDragging={isDragging}
            isInDragRange={dragRangeSet.has(index)}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
          />
        ))}
      </>
    );
  },
);

DatabaseTableBodyRows.displayName = "DatabaseTableBodyRows";

export default DatabaseTableBodyRows;
