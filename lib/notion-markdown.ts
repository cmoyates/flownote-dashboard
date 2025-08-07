import {
  NotionPageToMarkdownRequest,
  NotionPageToMarkdownResponse,
} from "@/types/notion";

/**
 * Convert Notion pages to markdown format
 * @param pageIds Array of Notion page IDs to convert
 * @returns Promise containing the markdown conversion results
 */
export const convertPagesToMarkdown = async (
  pageIds: string[]
): Promise<NotionPageToMarkdownResponse> => {
  if (!pageIds || pageIds.length === 0) {
    throw new Error("Page IDs array cannot be empty");
  }

  const request: NotionPageToMarkdownRequest = {
    pageIds,
  };

  try {
    const response = await fetch("/api/notion/pages/markdown", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const result: NotionPageToMarkdownResponse = await response.json();
    return result;
  } catch (error) {
    console.error("Error converting pages to markdown:", error);
    throw error;
  }
};

/**
 * Convert a single Notion page to markdown format
 * @param pageId Notion page ID to convert
 * @returns Promise containing the markdown content for the page
 */
export const convertPageToMarkdown = async (
  pageId: string
): Promise<string> => {
  if (!pageId || pageId.trim().length === 0) {
    throw new Error("Page ID cannot be empty");
  }

  const result = await convertPagesToMarkdown([pageId.trim()]);

  if (!result.success) {
    throw new Error("Failed to convert page to markdown");
  }

  const markdown = result.data[pageId.trim()];
  if (!markdown) {
    const errorMessage = result.errors?.[pageId.trim()];
    throw new Error(errorMessage || "Page not found in conversion results");
  }

  return markdown;
};
