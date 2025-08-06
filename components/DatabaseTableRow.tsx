import { MouseEvent, memo, useCallback, useMemo } from "react";
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

const DatabaseTableRow = memo(({
  row,
  rowIndex,
  isSelected,
  isDragging = false,
  isInDragRange = false,
  onMouseDown,
  onMouseEnter,
}: DatabaseTableRowProps) => {
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    onMouseDown?.(rowIndex, event);
  }, [onMouseDown, rowIndex]);

  const handleMouseEnter = useCallback(() => {
    onMouseEnter?.(rowIndex);
  }, [onMouseEnter, rowIndex]);

  const visibleCells = useMemo(() => row.getVisibleCells(), [row]);

  // Memoized className generation
  const rowClassName = useMemo(() => {
    let className = "cursor-pointer";

    if (isSelected) {
      className += " bg-blue-500/20 hover:bg-blue-500/30";
    } else {
      className += " hover:bg-muted/30";
    }

    if (isDragging && isInDragRange) {
      className += " bg-primary/20 border-primary/50";
    }

    return className;
  }, [isSelected, isDragging, isInDragRange]);

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
});

DatabaseTableRow.displayName = 'DatabaseTableRow';

export default DatabaseTableRow;
