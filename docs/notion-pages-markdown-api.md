# Notion Pages to Markdown API

## Overview

This API endpoint converts Notion pages to Markdown format using the `notion-to-md` library. It accepts an array of Notion page IDs and returns a JSON object mapping each page ID to its corresponding markdown content.

## Endpoint

```http
POST /api/notion/pages/markdown
```

## Request Body

```json
{
  "pageIds": ["page-id-1", "page-id-2", "page-id-3"]
}
```

### Parameters

- `pageIds` (required): An array of Notion page IDs (strings)
  - Must be a non-empty array
  - Each page ID must be a non-empty string
  - Page IDs should be valid Notion page identifiers

## Response

### Success Response

```json
{
  "success": true,
  "data": {
    "page-id-1": "# Page Title\n\nPage content in markdown...",
    "page-id-2": "# Another Page\n\nMore content...",
    "page-id-3": "# Third Page\n\nContent here..."
  },
  "errors": {
    "page-id-4": "Object not found"
  },
  "processedCount": 3,
  "errorCount": 1
}
```

### Response Fields

- `success` (boolean): `true` if at least one page was successfully converted
- `data` (object): Object mapping page IDs to their markdown content
- `errors` (object, optional): Object mapping page IDs to error messages for failed conversions
- `processedCount` (number): Number of pages successfully converted
- `errorCount` (number): Number of pages that failed to convert

### Error Response

```json
{
  "error": "pageIds must be an array of page IDs"
}
```

## Configuration

The endpoint is configured with the following `notion-to-md` settings:

- `parseChildPages: false` - Disabled for performance
- `separateChildPage: false` - Child pages are not separated
- `convertImagesToBase64: false` - Images remain as URLs

## Usage Example

### JavaScript/TypeScript

```javascript
const response = await fetch("/api/notion/pages/markdown", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    pageIds: ["your-notion-page-id-1", "your-notion-page-id-2"],
  }),
});

const result = await response.json();

if (result.success) {
  // Access markdown content
  console.log("Page 1 markdown:", result.data["your-notion-page-id-1"]);
  console.log("Page 2 markdown:", result.data["your-notion-page-id-2"]);

  // Check for any errors
  if (result.errors) {
    console.log("Some pages failed:", result.errors);
  }
} else {
  console.error("Request failed:", result.error);
}
```

### cURL

```bash
curl -X POST http://localhost:3000/api/notion/pages/markdown \
  -H "Content-Type: application/json" \
  -d '{
    "pageIds": [
      "your-notion-page-id-1",
      "your-notion-page-id-2"
    ]
  }'
```

## Error Handling

The API handles errors gracefully:

1. **Invalid Input**: Returns 400 status with error message
2. **Individual Page Errors**: Continues processing other pages and includes errors in response
3. **Server Errors**: Returns 500 status with error details

Common error scenarios:

- Page not found or not accessible
- Invalid page ID format
- Network issues with Notion API
- Permission errors

## Environment Variables

Make sure you have the following environment variable set:

- `NOTION_TOKEN`: Your Notion integration token with access to the pages you want to convert

## Notes

- The API processes all page IDs concurrently for better performance
- Failed page conversions don't stop the processing of other pages
- Only the main page content is returned (child pages are excluded for performance)
- Images are returned as URLs, not converted to base64
