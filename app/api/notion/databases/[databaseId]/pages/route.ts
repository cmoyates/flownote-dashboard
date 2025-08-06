import { Client, isFullPageOrDatabase } from "@notionhq/client";
import { NextRequest, NextResponse } from "next/server";
import type {
  PageObjectResponse,
  QueryDatabaseParameters,
} from "@notionhq/client/build/src/api-endpoints";

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

interface RouteParams {
  params: { databaseId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { databaseId } = params;

    // Validate database ID
    if (!databaseId) {
      return NextResponse.json(
        {
          error: "Database ID is required",
          message: "Please provide a valid database ID in the URL path",
        },
        { status: 400 }
      );
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = request.nextUrl;
    const pageSize = Math.min(
      parseInt(searchParams.get("page_size") || "100"),
      100
    );
    const startCursor = searchParams.get("start_cursor") || undefined;

    // Parse filter from query parameters if provided
    let filter: QueryDatabaseParameters["filter"];
    const filterParam = searchParams.get("filter");
    if (filterParam) {
      try {
        filter = JSON.parse(filterParam) as QueryDatabaseParameters["filter"];
      } catch {
        return NextResponse.json(
          {
            error: "Invalid filter format",
            message: "Filter must be a valid JSON object",
          },
          { status: 400 }
        );
      }
    }

    // Parse sorts from query parameters if provided
    let sorts: QueryDatabaseParameters["sorts"];
    const sortsParam = searchParams.get("sorts");
    if (sortsParam) {
      try {
        sorts = JSON.parse(sortsParam) as QueryDatabaseParameters["sorts"];
      } catch {
        return NextResponse.json(
          {
            error: "Invalid sorts format",
            message: "Sorts must be a valid JSON array",
          },
          { status: 400 }
        );
      }
    }

    // Query the database for pages
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: pageSize,
      start_cursor: startCursor,
      filter,
      sorts,
    });

    // Transform the pages data for better usability
    const pages = response.results
      .filter((page): page is PageObjectResponse => {
        // Use Notion SDK's type guard to ensure we have full page objects
        return isFullPageOrDatabase(page) && page.object === "page";
      })
      .map((page) => {
        // Extract basic page information
        const title = extractPageTitle(page);

        return {
          id: page.id,
          title,
          url: page.url,
          created_time: page.created_time,
          last_edited_time: page.last_edited_time,
          created_by: page.created_by,
          last_edited_by: page.last_edited_by,
          cover: page.cover,
          icon: page.icon,
          parent: page.parent,
          archived: page.archived,
          in_trash: page.in_trash,
          properties: page.properties,
        };
      });

    // Return the pages with pagination info
    return NextResponse.json(
      {
        pages,
        has_more: response.has_more,
        next_cursor: response.next_cursor,
        total_count: pages.length,
        database_id: databaseId,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching pages from database:", error);

    // Handle Notion API specific errors
    if (error && typeof error === "object" && "code" in error) {
      const notionError = error as {
        code: string;
        message: string;
        status?: number;
      };

      switch (notionError.code) {
        case "object_not_found":
          return NextResponse.json(
            {
              error: "Database not found",
              message: `Database with ID ${params.databaseId} was not found or is not accessible`,
            },
            { status: 404 }
          );
        case "unauthorized":
          return NextResponse.json(
            {
              error: "Unauthorized",
              message: "The integration does not have access to this database",
            },
            { status: 401 }
          );
        case "rate_limited":
          return NextResponse.json(
            {
              error: "Rate limited",
              message: "Too many requests. Please try again later",
            },
            { status: 429 }
          );
        default:
          return NextResponse.json(
            {
              error: "Notion API error",
              message: notionError.message || "An unexpected error occurred",
            },
            { status: notionError.status || 500 }
          );
      }
    }

    // Handle generic errors
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while fetching pages",
      },
      { status: 500 }
    );
  }
}

/**
 * Extract the title from a page object
 * Looks for title properties in the page's properties
 */
function extractPageTitle(page: PageObjectResponse): string {
  const properties = page.properties;

  // Look for a title property (common names: "Name", "Title", or the first title property)
  for (const [, property] of Object.entries(properties)) {
    if (property.type === "title" && property.title.length > 0) {
      return property.title[0].plain_text || "Untitled";
    }
  }

  // If no title found, return a default
  return "Untitled Page";
}
