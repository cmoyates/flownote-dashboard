import { MouseEvent } from "react";
import { flexRender, type Row } from "@tanstack/react-table";
import { TableCell, TableRow } from "@/components/ui/table";
import { NotionPage } from "@/types/notion";

interface DatabaseTableRowProps {
  row: Row<NotionPage>;
  rowIndex: number;
  isSelected: boolean;
  isDragging?: boolean;
  isInDragRange?: boolean;
  onMouseDown?: (rowIndex: number, event: MouseEvent) => void;
  onMouseEnter?: (rowIndex: number) => void;
}

const DatabaseTableRow = ({
  row,
  rowIndex,
  isSelected,
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

  const visibleCells = row.getVisibleCells();

  // Generate className
  let rowClassName = "cursor-pointer";

  if (isSelected) {
    rowClassName += " bg-blue-500/20 hover:bg-blue-500/30";
  } else {
    rowClassName += " hover:bg-muted/30";
  }

  if (isDragging && isInDragRange) {
    rowClassName += " bg-primary/20 border-primary/50";
  }

  return (
    <TableRow
      className={rowClassName}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
    >
      {visibleCells.map((cell) => (
        <TableCell key={cell.id} className="relative">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
};

export default DatabaseTableRow;
