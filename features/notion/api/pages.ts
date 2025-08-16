import { getNotionClient } from "@/lib/server/notionClient";
import { isFullPageOrDatabase } from "@notionhq/client";
import type {
  QueryDatabaseParameters,
  BlockObjectRequest,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { NotionPage } from "@/features/notion/schemas";

export async function queryDatabasePages(input: {
  database_id: string;
  page_size: number;
  start_cursor?: string;
  filter?: QueryDatabaseParameters["filter"];
  sorts?: QueryDatabaseParameters["sorts"];
}) {
  const notion = getNotionClient();
  const res = await notion.databases.query(input);

  const pages = res.results
    .filter(
      (page): page is PageObjectResponse =>
        isFullPageOrDatabase(page) && page.object === "page",
    )
    .map((page) => ({
      id: page.id,
      title: extractTitle(page),
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
    }));

  return {
    pages,
    has_more: res.has_more,
    next_cursor: res.next_cursor ?? null,
    total_count: pages.length,
  };
}

export async function createPageFromMarkdown(
  databaseId: string,
  args: {
    markdown: string;
    explicitTitle?: string;
  },
) {
  const notion = getNotionClient();
  const blocks = markdownToBlocks(args.markdown);
  if (!blocks.length)
    throw new Error("No content could be derived from markdown");

  let derivedTitle = args.explicitTitle?.trim() || "New Note";
  const first = blocks[0];
  if (
    first?.type === "heading_1" &&
    first.heading_1?.rich_text?.[0]?.type === "text"
  ) {
    derivedTitle = first.heading_1.rich_text[0].text.content || derivedTitle;
    blocks.shift();
  }

  const database = await notion.databases.retrieve({ database_id: databaseId });
  let titleProp = "Name";
  for (const [name, prop] of Object.entries(database.properties) as Array<
    [string, { type: string }]
  >)
    if (prop.type === "title") {
      titleProp = name;
      break;
    }

  const created = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      [titleProp]: {
        title: [{ type: "text", text: { content: derivedTitle } }],
      },
    },
    children: blocks,
  });

  return {
    id: created.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    url: (created as any as PageObjectResponse).url, // notion types…
    title: derivedTitle,
  };
}

// === helpers ===
function extractTitle(page: PageObjectResponse): NotionPage["title"] {
  for (const [, prop] of Object.entries(page.properties))
    if (prop.type === "title" && prop.title.length > 0)
      return prop.title[0].plain_text || "Untitled";
  return "Untitled";
}

// keep your simplified markdown converter here (or move to utils)
import { marked } from "marked";
import type { Tokens } from "marked";
function markdownToBlocks(markdown: string): BlockObjectRequest[] {
  const tokens = marked.lexer(markdown);
  const blocks: BlockObjectRequest[] = [];
  for (const token of tokens) {
    switch (token.type) {
      case "heading": {
        const depth = token.depth ?? 1;
        const text = String(token.text || "");
        const rich_text = [{ type: "text", text: { content: text } }];
        if (depth === 1)
          blocks.push({
            object: "block",
            type: "heading_1",
            heading_1: { rich_text },
          } as BlockObjectRequest);
        else if (depth === 2)
          blocks.push({
            object: "block",
            type: "heading_2",
            heading_2: { rich_text },
          } as BlockObjectRequest);
        else
          blocks.push({
            object: "block",
            type: "heading_3",
            heading_3: { rich_text },
          } as BlockObjectRequest);
        break;
      }
      case "paragraph":
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
      case "code": {
        const t = token as Tokens.Code;
        blocks.push({
          object: "block",
          type: "code",
          code: {
            rich_text: [
              { type: "text", text: { content: String(t.text || "") } },
            ],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            language: (t.lang && t.lang.length ? t.lang : "plain text") as any,
          },
        } as BlockObjectRequest);
        break;
      }
      case "list":
        for (const item of token.items || [])
          blocks.push({
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                { type: "text", text: { content: String(item.text || "") } },
              ],
            },
          } as BlockObjectRequest);
        break;
    }
  }
  return blocks;
}
