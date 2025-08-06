"use client";

import DatabaseCombobox from "@/components/DatabaseCombobox";
import DatabaseTable from "@/components/DatabaseTable";
import { Button } from "@/components/ui/button";
import { useDatabaseTableStore } from "@/stores/databaseTableStore";
import type { NotionDatabasesResponse } from "@/types/notion";
import { useEffect, useMemo, useCallback } from "react";

export default function Home() {
  const { setAllDatabases, activeDatabaseID, rowSelection, pages } =
    useDatabaseTableStore();

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await fetch("/api/notion/databases");
        if (!response.ok) {
          throw new Error("Failed to fetch databases");
        }
        const data: NotionDatabasesResponse = await response.json();
        setAllDatabases(data.databases);
      } catch (error) {
        console.error("Error fetching databases:", error);
      }
    };

    fetchDatabases();
  }, [setAllDatabases]);

  // Memoize selected pages calculation to avoid recalculating on every render
  const selectedPages = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => pages[parseInt(index)])
      .filter(Boolean);
  }, [rowSelection, pages]);

  const handleClick = useCallback(() => {
    console.log("Active Database ID:", activeDatabaseID);
    console.log("Selected Pages:", selectedPages);
    console.log("Row Selection State:", rowSelection);
  }, [activeDatabaseID, selectedPages, rowSelection]);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div className="flex flex-row items-center gap-4 justify-end w-full">
        <Button onClick={handleClick}>Log Selected Pages</Button>
        <DatabaseCombobox />
      </div>
      <div className="w-full flex-1 h-full">
        <DatabaseTable />
      </div>
    </div>
  );
}
