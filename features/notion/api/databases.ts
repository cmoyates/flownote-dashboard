import { getNotionClient } from "@/lib/server/notionClient";

export async function searchDatabases(
  page_size: number,
  start_cursor?: string,
) {
  const notion = getNotionClient();
  const res = await notion.search({
    filter: { property: "object", value: "database" },
    sort: { direction: "descending", timestamp: "last_edited_time" },
    page_size,
    start_cursor,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const databases = res.results.map((db: any) => {
    const title = db?.title?.[0]?.plain_text ?? "Untitled Database";
    const properties = Object.entries(db.properties ?? {}).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ([name, prop]: any) => ({
        name,
        type: prop?.type,
        id: prop?.id,
      }),
    );
    return {
      id: db.id,
      title,
      description: db?.description?.[0]?.plain_text ?? null,
      url: db.url,
      created_time: db.created_time,
      last_edited_time: db.last_edited_time,
      created_by: db.created_by,
      last_edited_by: db.last_edited_by,
      cover: db.cover,
      icon: db.icon,
      properties,
      parent: db.parent,
      archived: !!db.archived,
      is_inline: !!db.is_inline,
      public_url: db.public_url ?? null,
    };
  });

  return {
    databases,
    has_more: res.has_more,
    next_cursor: res.next_cursor ?? null,
    total_count: databases.length,
  };
}
