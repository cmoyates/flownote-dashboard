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

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  created_by: unknown;
  last_edited_by: unknown;
  cover: unknown;
  icon: unknown;
  parent: unknown;
  archived: boolean;
  in_trash: boolean;
  properties: Record<string, unknown>;
}

export interface NotionDatabasesResponse {
  databases: NotionDatabase[];
  has_more: boolean;
  next_cursor: string | null;
  total_count: number;
}

export interface NotionPagesResponse {
  pages: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
  total_count: number;
  database_id: string;
}

export interface NotionAPIError {
  error: string;
  message: string;
  details?: string;
  code?: string;
}

// Notion Pages to Markdown API Types
export interface NotionPageToMarkdownRequest {
  pageIds: string[];
}

export interface NotionPageToMarkdownResponse {
  success: boolean;
  data: Record<string, string>;
  errors?: Record<string, string>;
  processedCount: number;
  errorCount: number;
}
