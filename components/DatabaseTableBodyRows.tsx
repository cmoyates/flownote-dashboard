import { MouseEvent } from "react";
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
}

const DatabaseTableBodyRows = ({
  table,
  isDragging,
  dragRange,
  rowSelection,
  onMouseDown,
  onMouseEnter,
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
};

export default DatabaseTableBodyRows;
