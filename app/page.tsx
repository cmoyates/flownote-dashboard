"use client";

import DatabaseCombobox from "@/components/DatabaseCombobox";
import DatabaseTable from "@/components/DatabaseTable";
import { CommandMenu } from "@/components/CommandMenu";
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
      <div className="font-sans flex flex-col items-center justify-items-center h-screen px-24 py-12 gap-8">
        <DatabaseLoader />
        <div className="flex flex-row items-center gap-4 justify-between w-full">
          <h1 className="font-bold text-2xl">FlowNote Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden sm:block">
              Press{" "}
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                /
              </kbd>{" "}
              for commands
            </div>
            <DatabaseCombobox />
          </div>
        </div>

        <div className="flex-1 w-full min-h-0">
          <DatabaseTable />
        </div>
      </div>
    </>
  );
}
