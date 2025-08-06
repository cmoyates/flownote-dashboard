"use client";

import DatabaseCombobox from "@/components/DatabaseCombobox";
import DatabaseTable from "@/components/DatabaseTable";
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
    <div className="font-sans flex flex-col items-center justify-items-center min-h-screen max-h-screen p-20 gap-8">
      <DatabaseLoader />
      <div className="flex flex-row items-center gap-4 justify-between w-full">
        <h1 className="font-bold text-2xl">FlowNote Dashboard</h1>
        <DatabaseCombobox />
      </div>

      <div className="flex-1 w-full h-full bg-red-500/5">
        <DatabaseTable />
      </div>
    </div>
  );
}
