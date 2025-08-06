"use client";

import { Button } from "@/components/ui/button";
import type { NotionDatabasesResponse } from "@/types/notion";

export default function Home() {
  const handleClick = async () => {
    console.log("Fetching Notion databases...");

    try {
      const response = await fetch("/api/notion/databases");

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        return;
      }

      const data: NotionDatabasesResponse = await response.json();

      console.log("Databases found:", data.databases.length);

      // Log all database IDs
      const databaseIds = data.databases.map((db) => db.id);
      console.log("Database IDs:", databaseIds);

      // Also log database titles for better context
      data.databases.forEach((db) => {
        console.log(`Database: "${db.title}" (ID: ${db.id})`);
      });
    } catch (error) {
      console.error("Failed to fetch databases:", error);
    }
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <Button onClick={handleClick}>Click me</Button>
    </div>
  );
}
