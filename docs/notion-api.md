# Notion API Route - Get Databases

This API route allows you to fetch all databases from a Notion workspace using the `@notionhq/client` library.

## Setup

1. **Create a Notion Integration:**

   - Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
   - Click "New integration"
   - Give it a name and select your workspace
   - Copy the "Internal Integration Token"

2. **Set Environment Variable:**
   Create a `.env.local` file in your project root and add:

   ```bash
   NOTION_API_KEY=your_notion_integration_token_here
   ```

3. **Grant Database Access:**
   - Open each Notion database you want to access
   - Click the three dots menu → "Add connections"
   - Select your integration

## API Endpoint

**URL:** `/api/notion/databases`  
**Method:** `GET`

### Query Parameters

- `page_size` (optional): Number of results per page (default: 100, max: 100)
- `start_cursor` (optional): Pagination cursor for next page

### Response Format

```json
{
  "databases": [
    {
      "id": "database-uuid",
      "title": "My Database",
      "description": "Database description",
      "url": "https://notion.so/...",
      "created_time": "2025-01-01T00:00:00.000Z",
      "last_edited_time": "2025-01-01T00:00:00.000Z",
      "properties": [
        {
          "name": "Title",
          "type": "title",
          "id": "property-id"
        }
      ],
      "archived": false,
      "is_inline": false,
      "public_url": null
    }
  ],
  "has_more": false,
  "next_cursor": null,
  "total_count": 1
}
```

### Error Responses

- **401 Unauthorized**: Invalid API key or missing permissions
- **429 Rate Limited**: Too many requests
- **500 Internal Server Error**: Missing API key or other server errors

## Usage Example

```typescript
// Fetch all databases
const response = await fetch("/api/notion/databases");
const data = await response.json();

if (response.ok) {
  console.log("Databases:", data.databases);
} else {
  console.error("Error:", data.error);
}

// Fetch with pagination
const response = await fetch(
  "/api/notion/databases?page_size=50&start_cursor=abc123"
);
```

## Features

- ✅ TypeScript support with proper type definitions
- ✅ Error handling for common Notion API errors
- ✅ Pagination support
- ✅ Property information extraction
- ✅ Clean data transformation
- ✅ Environment variable validation

## File Structure

- `app/api/notion/databases/route.ts` - Main API route
- `types/notion.ts` - TypeScript type definitions
- `types/env.d.ts` - Environment variable types
- `.env.example` - Environment variable template
