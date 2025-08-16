import { NextRequest, NextResponse } from "next/server";
import {
  ListPagesQuery,
  ListPagesResponseSchema,
  CreatePageBodySchema,
} from "@/features/notion/schemas";
import {
  queryDatabasePages,
  createPageFromMarkdown,
} from "@/features/notion/api/pages";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { databaseId: string } },
) {
  const { searchParams } = req.nextUrl;
  const query = ListPagesQuery.parse({
    page_size: searchParams.get("page_size"),
    start_cursor: searchParams.get("start_cursor") ?? undefined,
    filter: searchParams.get("filter") ?? undefined,
    sorts: searchParams.get("sorts") ?? undefined,
  });

  const data = await queryDatabasePages({
    database_id: params.databaseId,
    page_size: query.page_size,
    start_cursor: query.start_cursor,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: query.filter as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sorts: query.sorts as any,
  });

  // validate outgoing payload
  const json = ListPagesResponseSchema.parse({
    ...data,
    database_id: params.databaseId,
  });
  return NextResponse.json(json, { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { databaseId: string } },
) {
  const body = CreatePageBodySchema.parse(await req.json());
  const created = await createPageFromMarkdown(params.databaseId, {
    markdown: body.markdown,
    explicitTitle: body.title,
  });
  return NextResponse.json(
    {
      success: true,
      page: { id: created.id, url: created.url },
      title: created.title,
    },
    { status: 201 },
  );
}
