import React from "react";
import { flexRender, type Row } from "@tanstack/react-table";
import { TableCell, TableRow } from "@/components/ui/table";
import { NotionPage } from "@/types/notion";

interface DatabaseTableRowProps {
  row: Row<NotionPage>;
}

const DatabaseTableRow = ({ row }: DatabaseTableRowProps) => {
  return (
    <TableRow>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
};

export default DatabaseTableRow;
