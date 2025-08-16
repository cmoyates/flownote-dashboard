import { NextRequest, NextResponse } from "next/server";
import {
  ListDatabasesQuerySchema,
  ListDatabasesResponseSchema,
} from "@/features/notion/schemas";
import { searchDatabases } from "@/features/notion/api/databases";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = ListDatabasesQuerySchema.parse({
    page_size: searchParams.get("page_size"),
    start_cursor: searchParams.get("start_cursor") ?? undefined,
  });

  const data = await searchDatabases(query.page_size, query.start_cursor);
  const json = ListDatabasesResponseSchema.parse(data);
  return NextResponse.json(json, { status: 200 });
}
