import { Client, isFullPageOrDatabase } from "@notionhq/client";
import { NextRequest, NextResponse } from "next/server";
import type {
  PageObjectResponse,
  QueryDatabaseParameters,
  BlockObjectRequest,
  CreatePageResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { marked } from "marked";
import type { Tokens } from "marked";

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

interface RouteContext {
  params: Promise<{ databaseId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    // Check if API key is configured
    if (!process.env.NOTION_API_KEY) {
      return NextResponse.json(
        {
          error: "Notion API key not configured",
          message: "Please add NOTION_API_KEY to your environment variables",
        },
        { status: 500 },
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
        { status: 400 },
      );
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = request.nextUrl;
    const pageSize = Math.min(
      parseInt(searchParams.get("page_size") || "50"),
      50,
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
          { status: 400 },
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
          { status: 400 },
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
      { status: 200 },
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
            { status: 404 },
          );
        case "unauthorized":
          return NextResponse.json(
            {
              error: "Unauthorized",
              message: "The integration does not have access to this database",
            },
            { status: 401 },
          );
        case "rate_limited":
          return NextResponse.json(
            {
              error: "Rate limited",
              message: "Too many requests. Please try again later",
            },
            { status: 429 },
          );
        default:
          return NextResponse.json(
            {
              error: "Notion API error",
              message: notionError.message || "An unexpected error occurred",
            },
            { status: notionError.status || 500 },
          );
      }
    }

    // Handle generic errors
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while fetching pages",
      },
      { status: 500 },
    );
  }
}

// Ensure Node.js runtime for Notion SDK
export const runtime = "nodejs";

// Convert a Markdown string to Notion BlockObjectRequests (simplified)
const markdownToNotionBlocks = (markdown: string): BlockObjectRequest[] => {
  const tokens = marked.lexer(markdown as string);
  const blocks: BlockObjectRequest[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case "heading": {
        // Only support heading_1, heading_2, heading_3 as per Notion API
        const headingType =
          token.depth === 1
            ? "heading_1"
            : token.depth === 2
              ? "heading_2"
              : "heading_3";

        if (headingType === "heading_1") {
          blocks.push({
            object: "block",
            type: "heading_1",
            heading_1: {
              rich_text: [
                { type: "text", text: { content: String(token.text || "") } },
              ],
            },
          } as BlockObjectRequest);
        } else if (headingType === "heading_2") {
          blocks.push({
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [
                { type: "text", text: { content: String(token.text || "") } },
              ],
            },
          } as BlockObjectRequest);
        } else {
          blocks.push({
            object: "block",
            type: "heading_3",
            heading_3: {
              rich_text: [
                { type: "text", text: { content: String(token.text || "") } },
              ],
            },
          } as BlockObjectRequest);
        }
        break;
      }

      case "paragraph": {
        blocks.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              { type: "text", text: { content: String(token.text || "") } },
            ],
          },
        } as BlockObjectRequest);
        break;
      }

      case "code": {
        const codeToken = token as Tokens.Code;
        blocks.push({
          object: "block",
          type: "code",
          code: {
            rich_text: [
              { type: "text", text: { content: String(codeToken.text || "") } },
            ],
            language:
              typeof codeToken.lang === "string" && codeToken.lang.length > 0
                ? codeToken.lang
                : ("plain text" as string),
          },
        } as BlockObjectRequest);
        break;
      }

      case "list": {
        // Simplified list handling: map to bulleted list items
        for (const item of token.items || []) {
          blocks.push({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { type: "text", text: { content: String(item.text || "") } },
              ],
            },
          } as BlockObjectRequest);
        }
        break;
      }

      case "space":
        // Ignore spacing tokens
        break;

      default:
        // Unsupported token types are skipped to keep implementation simple
        break;
    }
  }

  return blocks;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    // Check API key
    if (!process.env.NOTION_API_KEY) {
      return NextResponse.json(
        {
          error: "Notion API key not configured",
          message: "Please add NOTION_API_KEY to your environment variables",
        },
        { status: 500 },
      );
    }

    const { databaseId } = params;

    if (!databaseId) {
      return NextResponse.json(
        { error: "Database ID is required in the URL path" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { markdown, title: explicitTitle } = body as {
      markdown?: string;
      title?: string;
    };

    if (
      !markdown ||
      typeof markdown !== "string" ||
      markdown.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "'markdown' must be a non-empty string" },
        { status: 400 },
      );
    }

    // Build blocks from markdown
    const blocks = markdownToNotionBlocks(markdown);

    if (!blocks.length) {
      return NextResponse.json(
        { error: "No content could be derived from markdown" },
        { status: 400 },
      );
    }

    // Determine title
    let derivedTitle =
      explicitTitle &&
      typeof explicitTitle === "string" &&
      explicitTitle.trim().length > 0
        ? explicitTitle.trim()
        : "New Note";

    // If first block is H1, use it as title and remove it from children
    const firstBlock = blocks[0];
    if (
      firstBlock &&
      firstBlock.type === "heading_1" &&
      firstBlock.heading_1?.rich_text &&
      firstBlock.heading_1.rich_text[0]?.type === "text"
    ) {
      const rich = firstBlock.heading_1.rich_text[0];
      derivedTitle = rich.text.content || derivedTitle;
      blocks.shift();
    }

    // Retrieve database to find actual title property name
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });
    let titlePropertyName = "Name";
    for (const [propName, prop] of Object.entries(database.properties) as Array<
      [string, { type: string }]
    >) {
      if (prop.type === "title") {
        titlePropertyName = propName;
        break;
      }
    }

    const created: CreatePageResponse = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        [titlePropertyName]: {
          title: [
            {
              type: "text",
              text: { content: derivedTitle },
            },
          ],
        },
      },
      children: blocks,
    });

    return NextResponse.json(
      {
        success: true,
        page: {
          id: created.id,
          url:
            "url" in created ? (created as PageObjectResponse).url : undefined,
        },
        title: derivedTitle,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error creating page in Notion:", error);

    // Basic Notion error handling
    if (error && typeof error === "object" && "code" in error) {
      const notionError = error as {
        code: string;
        message?: string;
        status?: number;
      };
      switch (notionError.code) {
        case "object_not_found":
          return NextResponse.json(
            { error: "Database not found or inaccessible" },
            { status: 404 },
          );
        case "validation_error":
          return NextResponse.json(
            {
              error: "Validation error creating page",
              details: notionError.message,
            },
            { status: 400 },
          );
        case "unauthorized":
          return NextResponse.json(
            { error: "Unauthorized to access Notion API" },
            { status: 401 },
          );
        default:
          return NextResponse.json(
            { error: "Notion API error", details: notionError.message },
            { status: notionError.status || 500 },
          );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
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
