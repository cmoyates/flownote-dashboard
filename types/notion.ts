// Notion API related types for better type safety

export interface NotionDatabaseProperty {
  name: string;
  type: string;
  id: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  description: string | null;
  url: string;
  created_time: string;
  last_edited_time: string;
  created_by: unknown;
  last_edited_by: unknown;
  cover: unknown;
  icon: unknown;
  properties: NotionDatabaseProperty[];
  parent: unknown;
  archived: boolean;
  is_inline: boolean;
  public_url: string | null;
}

export interface NotionDatabasesResponse {
  databases: NotionDatabase[];
  has_more: boolean;
  next_cursor: string | null;
  total_count: number;
}

export interface NotionAPIError {
  error: string;
  message: string;
  details?: string;
  code?: string;
}
