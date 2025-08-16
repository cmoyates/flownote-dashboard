import { z } from "zod";

export const MarkdownBatchBodySchema = z.object({
  pageIds: z.array(z.string().min(1)).min(1),
});

export const MarkdownBatchResponseSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), z.string()).optional(),
  errors: z.record(z.string(), z.string()).optional(),
  processedCount: z.number(),
  errorCount: z.number(),
});
