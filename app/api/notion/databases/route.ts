import { Client } from "@notionhq/client";
import { NextRequest, NextResponse } from "next/server";
import type { NotionDatabase, NotionDatabaseProperty } from "@/types/notion";

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.NOTION_API_KEY) {
      return NextResponse.json(
        {
          error: "Notion API key not configured",
          message: "Please add NOTION_API_KEY to your environment variables",
        },
        { status: 500 }
      );
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = request.nextUrl;
    const pageSize = Math.min(
      parseInt(searchParams.get("page_size") || "100"),
      100
    );
    const startCursor = searchParams.get("start_cursor") || undefined;

    // Search for databases in the workspace
    const response = await notion.search({
      filter: {
        property: "object",
        value: "database",
      },
      sort: {
        direction: "descending",
        timestamp: "last_edited_time",
      },
      page_size: pageSize,
      start_cursor: startCursor,
    });

    // Transform the databases data for better usability
    const databases: NotionDatabase[] = response.results.map(
      (database: Record<string, unknown>) => {
        const title =
          (database.title as Array<{ plain_text?: string }>)?.[0]?.plain_text ||
          "Untitled Database";

        // Extract property information
        const properties: NotionDatabaseProperty[] = Object.entries(
          (database.properties as Record<string, Record<string, unknown>>) || {}
        ).map(([name, property]: [string, Record<string, unknown>]) => ({
          name,
          type: property.type as string,
          id: property.id as string,
        }));

        return {
          id: database.id as string,
          title,
          description:
            (database.description as Array<{ plain_text?: string }>)?.[0]
              ?.plain_text || null,
          url: database.url as string,
          created_time: database.created_time as string,
          last_edited_time: database.last_edited_time as string,
          created_by: database.created_by,
          last_edited_by: database.last_edited_by,
          cover: database.cover,
          icon: database.icon,
          properties,
          parent: database.parent,
          archived: database.archived as boolean,
          is_inline: database.is_inline as boolean,
          public_url: database.public_url as string | null,
        };
      }
    );

    return NextResponse.json({
      databases,
      has_more: response.has_more,
      next_cursor: response.next_cursor,
      total_count: databases.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching Notion databases:", error);

    const errorObj = error as { code?: string; message?: string };

    // Handle specific Notion API errors
    if (errorObj.code === "unauthorized") {
      return NextResponse.json(
        {
          error: "Unauthorized access to Notion",
          message:
            "Please check your Notion API key and integration permissions",
          details: errorObj.message,
        },
        { status: 401 }
      );
    }

    if (errorObj.code === "rate_limited") {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many requests to Notion API. Please try again later.",
          details: errorObj.message,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch databases",
        message: "An error occurred while fetching databases from Notion",
        details: errorObj.message || "Unknown error",
        code: errorObj.code || "unknown_error",
      },
      { status: 500 }
    );
  }
}
