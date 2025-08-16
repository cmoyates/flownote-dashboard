import { z } from "zod";

/**
 * Notion database property schema
 * Matches features/notion/types/page.ts: NotionDatabaseProperty
 */
export const NotionDatabasePropertySchema = z.strictObject({
  name: z.string(),
  type: z.string(),
  id: z.string(),
});

/**
 * Notion database schema
 * Matches features/notion/types/page.ts: NotionDatabase
 */
export const NotionDatabaseSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  url: z.url(),
  created_time: z.iso.datetime(),
  last_edited_time: z.iso.datetime(),
  created_by: z.unknown(),
  last_edited_by: z.unknown(),
  cover: z.unknown(),
  icon: z.unknown(),
  properties: z.array(NotionDatabasePropertySchema),
  parent: z.unknown(),
  archived: z.boolean(),
  is_inline: z.boolean(),
  public_url: z.url().nullable(),
});

export type NotionDatabaseProperty = z.infer<
  typeof NotionDatabasePropertySchema
>;

export type NotionDatabase = z.infer<typeof NotionDatabaseSchema>;

export const ListDatabasesQuerySchema = z.object({
  page_size: z.coerce.number().int().min(1).max(100).default(100),
  start_cursor: z.string().optional(),
});

export const ListDatabasesResponseSchema = z.object({
  databases: z.array(NotionDatabaseSchema),
  has_more: z.boolean(),
  next_cursor: z.string().nullable(),
  total_count: z.number(),
});
