import { z } from "zod";

/**
 * Notion page schema
 * Matches features/notion/types/page.ts: NotionPage
 */
export const NotionPageSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  url: z.url(),
  created_time: z.iso.datetime(),
  last_edited_time: z.iso.datetime(),
  created_by: z.unknown(),
  last_edited_by: z.unknown(),
  cover: z.unknown(),
  icon: z.unknown(),
  parent: z.unknown(),
  archived: z.boolean(),
  in_trash: z.boolean(),
  properties: z.record(z.string(), z.unknown()),
});

export type NotionPage = z.infer<typeof NotionPageSchema>;
