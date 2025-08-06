import React from "react";
import { flexRender, type Row } from "@tanstack/react-table";
import { TableCell, TableRow } from "@/components/ui/table";
import { NotionPage } from "@/types/notion";

interface DatabaseTableRowProps {
  row: Row<NotionPage>;
  rowIndex: number;
  isDragging?: boolean;
  isInDragRange?: boolean;
  onMouseDown?: (rowIndex: number, event: React.MouseEvent) => void;
  onMouseEnter?: (rowIndex: number) => void;
}

const DatabaseTableRow = ({
  row,
  rowIndex,
  isDragging = false,
  isInDragRange = false,
  onMouseDown,
  onMouseEnter,
}: DatabaseTableRowProps) => {
  const handleMouseDown = (event: React.MouseEvent) => {
    onMouseDown?.(rowIndex, event);
  };

  const handleMouseEnter = () => {
    onMouseEnter?.(rowIndex);
  };

  return (
    <TableRow
      className={`
        cursor-pointer
        ${
          row.getIsSelected()
            ? "bg-blue-500/20 hover:bg-blue-500/30"
            : "hover:bg-muted/30"
        } 
        ${isDragging && isInDragRange ? "bg-primary/20 border-primary/50" : ""}
      `
        .trim()
        .replace(/\s+/g, " ")}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className="relative">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
};

export default DatabaseTableRow;
