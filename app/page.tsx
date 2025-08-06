"use client";

import DatabaseCombobox from "@/components/DatabaseCombobox";
import { Button } from "@/components/ui/button";
import { useDatabaseTableStore } from "@/stores/databaseTableStore";
import type { NotionDatabasesResponse } from "@/types/notion";
import { useEffect } from "react";

export default function Home() {
  const { setAllDatabases, activeDatabaseID } = useDatabaseTableStore();

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
  }, []);

  const handleClick = () => {
    console.log("Active Database ID:", activeDatabaseID);
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <Button onClick={handleClick}>Click me</Button>
      <DatabaseCombobox />
    </div>
  );
}
