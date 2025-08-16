import { z } from "zod";
import { NotionDatabaseSchema } from "./database";
import { NotionPageSchema } from "./page";

/**
 * NotionAPIError schema
 */
export const NotionAPIErrorSchema = z.strictObject({
  error: z.string(),
  message: z.string(),
  details: z.string().optional(),
  code: z.string().optional(),
});
export type NotionAPIError = z.infer<typeof NotionAPIErrorSchema>;

/**
 * NotionDatabasesResponse schema
 */
export const NotionDatabasesResponseSchema = z.strictObject({
  databases: z.array(NotionDatabaseSchema),
  has_more: z.boolean(),
  next_cursor: z.string().nullable(),
  total_count: z.number(),
});
export type NotionDatabasesResponse = z.infer<
  typeof NotionDatabasesResponseSchema
>;

/**
 * NotionPagesResponse schema
 */
export const NotionPagesResponseSchema = z.strictObject({
  pages: z.array(NotionPageSchema),
  has_more: z.boolean(),
  next_cursor: z.string().nullable(),
  total_count: z.number(),
  database_id: z.string(),
});
export type NotionPagesResponse = z.infer<typeof NotionPagesResponseSchema>;

/**
 * Notion Pages to Markdown API Schemas
 */
export const NotionPageToMarkdownRequestSchema = z.strictObject({
  pageIds: z.array(z.string()).nonempty(),
});
export type NotionPageToMarkdownRequest = z.infer<
  typeof NotionPageToMarkdownRequestSchema
>;

export const NotionPageToMarkdownResponseSchema = z.strictObject({
  success: z.boolean(),
  data: z.record(z.string(), z.string()),
  errors: z.record(z.string(), z.string()).optional(),
  processedCount: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative(),
});
export type NotionPageToMarkdownResponse = z.infer<
  typeof NotionPageToMarkdownResponseSchema
>;
