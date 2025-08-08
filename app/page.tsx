"use client";

import DatabaseCombobox from "@/components/DatabaseCombobox";
import DatabaseTable from "@/components/DatabaseTable";
import { CommandMenu } from "@/components/CommandMenu/CommandMenu";
import { useDatabaseTableStore } from "@/stores/databaseTableStore";
import type { NotionDatabasesResponse } from "@/types/notion";
import { useEffect } from "react";

// Extracted data fetching component following "move state down" principle
function DatabaseLoader() {
  const setAllDatabases = useDatabaseTableStore().setAllDatabases;

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

  return null; // This component only handles data fetching
}

// Main layout component with stable structure
export default function Home() {
  return (
    <>
      <CommandMenu />
      <div className="flex h-screen flex-col items-center justify-items-center gap-8 px-24 py-12 font-sans">
        <DatabaseLoader />
        <div className="flex w-full flex-row items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">FlowNote Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="text-muted-foreground hidden text-sm sm:block">
              Press{" "}
              <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
                /
              </kbd>{" "}
              for commands
            </div>
            <DatabaseCombobox />
          </div>
        </div>

        <div className="min-h-0 w-full flex-1">
          <DatabaseTable />
        </div>
      </div>
    </>
  );
}
