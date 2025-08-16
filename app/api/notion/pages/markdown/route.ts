import { NextRequest, NextResponse } from "next/server";
import {
  MarkdownBatchBodySchema,
  MarkdownBatchResponseSchema,
} from "@/features/notion/schemas/markdown";
import { pagesToMarkdown } from "@/features/notion/api/markdown";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { pageIds } = MarkdownBatchBodySchema.parse(await req.json());
  const { result, errors } = await pagesToMarkdown(pageIds);

  const processedCount = Object.keys(result).length;
  const errorCount = Object.keys(errors).length;

  const payload = {
    success: processedCount > 0,
    data: processedCount ? result : undefined,
    errors: errorCount ? errors : undefined,
    processedCount,
    errorCount,
  };
  return NextResponse.json(MarkdownBatchResponseSchema.parse(payload), {
    status: 200,
  });
}
