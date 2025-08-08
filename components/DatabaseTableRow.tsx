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

const DatabaseTableRow = memo(
  ({
    row,
    rowIndex,
    isSelected,
    isDragging = false,
    isInDragRange = false,
    onMouseDown,
    onMouseEnter,
  }: DatabaseTableRowProps) => {
    const handleMouseDown = useCallback(
      (event: React.MouseEvent) => {
        onMouseDown?.(rowIndex, event);
      },
      [onMouseDown, rowIndex],
    );

    const handleMouseEnter = useCallback(() => {
      onMouseEnter?.(rowIndex);
    }, [onMouseEnter, rowIndex]);

    const visibleCells = useMemo(() => row.getVisibleCells(), [row]);

    // Memoized className generation
    const rowClassName = useMemo(() => {
      let baseClasses = "cursor-pointer";

      // Priority: highlighted > selected > deselected
      if (isDragging && isInDragRange) {
        // Highlighted state (gray background)
        baseClasses +=
          " bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800";
      } else if (isSelected) {
        // Selected state (blue background)
        baseClasses +=
          " bg-blue-100 dark:bg-blue-500/30 hover:bg-blue-200 dark:hover:bg-blue-500/40";
      } else {
        // Deselected state (no background, low-opacity black overlay on hover)
        baseClasses += " bg-transparent hover:bg-black/5 dark:hover:bg-white/5";
      }

      return baseClasses;
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
  },
);

DatabaseTableRow.displayName = "DatabaseTableRow";

export default DatabaseTableRow;
