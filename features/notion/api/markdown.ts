import { getNotionClient } from "@/lib/server/notionClient";
import { NotionToMarkdown } from "notion-to-md";

export async function pagesToMarkdown(pageIds: string[]) {
  const notion = getNotionClient();
  const n2m = new NotionToMarkdown({
    notionClient: notion,
    config: {
      parseChildPages: false,
      separateChildPage: false,
      convertImagesToBase64: false,
    },
  });

  const result: Record<string, string> = {};
  const errors: Record<string, string> = {};

  // TIP: you can limit concurrency with p-limit if you hit 429s
  await Promise.allSettled(
    pageIds.map(async (pageId) => {
      try {
        const page = await notion.pages.retrieve({ page_id: pageId });
        const title = getTitle(page);
        const mdBlocks = await n2m.pageToMarkdown(pageId);
        const md = n2m.toMarkdownString(mdBlocks).parent || "";
        result[pageId] = `# ${title}\n\n${md}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        errors[pageId] = e?.message ?? "Unknown error";
      }
    }),
  );

  return { result, errors };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTitle(page: any) {
  if (page?.properties) {
    for (const [, prop] of Object.entries(page.properties) as Array<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [string, any]
    >)
      if (prop?.type === "title" && prop.title?.length)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return prop.title.map((t: any) => t.plain_text).join("");
  }
  return "Untitled";
}
