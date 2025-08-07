import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { NextRequest, NextResponse } from "next/server";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const n2m = new NotionToMarkdown({
  notionClient: notion,
  config: {
    parseChildPages: false, // Disable child page parsing for performance
    separateChildPage: false, // Don't separate child pages
    convertImagesToBase64: false, // Keep image URLs instead of base64
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageIds } = body;

    // Validate input
    if (!pageIds || !Array.isArray(pageIds)) {
      return NextResponse.json(
        { error: "pageIds must be an array of page IDs" },
        { status: 400 }
      );
    }

    if (pageIds.length === 0) {
      return NextResponse.json(
        { error: "pageIds array cannot be empty" },
        { status: 400 }
      );
    }

    // Validate each page ID
    for (const pageId of pageIds) {
      if (typeof pageId !== "string" || pageId.trim().length === 0) {
        return NextResponse.json(
          { error: "All page IDs must be non-empty strings" },
          { status: 400 }
        );
      }
    }

    const result: Record<string, string> = {};
    const errors: Record<string, string> = {};

    // Process each page ID
    await Promise.allSettled(
      pageIds.map(async (pageId: string) => {
        try {
          const trimmedPageId = pageId.trim();

          // Fetch page title
          const page = await notion.pages.retrieve({
            page_id: trimmedPageId,
          });

          let pageTitle = "Untitled";

          // Extract title from page properties
          if ("properties" in page && page.properties) {
            // Find the title property (usually the first property or one with type "title")
            for (const [, property] of Object.entries(page.properties)) {
              if (
                property.type === "title" &&
                property.title &&
                property.title.length > 0
              ) {
                pageTitle = property.title
                  .map((t: { plain_text: string }) => t.plain_text)
                  .join("");
                break;
              }
            }
          }

          // Convert page to markdown blocks
          const mdBlocks = await n2m.pageToMarkdown(trimmedPageId);

          // Convert blocks to markdown string
          const mdString = n2m.toMarkdownString(mdBlocks);

          // Prepend title as H1 to the markdown content
          const markdownContent = mdString.parent || "";
          const titleHeader = `# ${pageTitle}\n\n`;
          const finalMarkdown = titleHeader + markdownContent;

          // Store the final markdown content
          result[pageId] = finalMarkdown;
        } catch (error) {
          console.error(`Error converting page ${pageId} to markdown:`, error);

          // Store error message for this specific page
          if (error instanceof Error) {
            errors[pageId] = error.message;
          } else {
            errors[pageId] =
              "Unknown error occurred while converting page to markdown";
          }
        }
      })
    );

    // Return results with any errors
    return NextResponse.json({
      success: Object.keys(result).length > 0,
      data: result,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      processedCount: Object.keys(result).length,
      errorCount: Object.keys(errors).length,
    });
  } catch (error) {
    console.error("Error in markdown conversion API:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
