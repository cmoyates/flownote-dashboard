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

export const ListPagesQuery = z.object({
  page_size: z.coerce.number().int().min(1).max(50).default(50),
  start_cursor: z.string().optional(),
  filter: z
    .string()
    .transform((s) => JSON.parse(s))
    .optional()
    .catch(undefined),
  sorts: z
    .string()
    .transform((s) => JSON.parse(s))
    .optional()
    .catch(undefined),
});

export const ListPagesResponseSchema = z.object({
  pages: z.array(NotionPageSchema),
  has_more: z.boolean(),
  next_cursor: z.string().nullable(),
  total_count: z.number(),
  database_id: z.string(),
});
export type ListPagesResponse = z.infer<typeof ListPagesResponseSchema>;

export const CreatePageBodySchema = z.object({
  markdown: z.string().min(1),
  title: z.string().optional(),
});
