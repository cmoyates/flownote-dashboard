# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server (uses Turbopack for fast builds)
npm run dev
# or
bun dev

# Production build
npm run build

# Linting
npm run lint

# Environment Setup
# Create .env.local and add:
# NOTION_API_KEY=your_notion_integration_token_here
```

## Architecture Overview

This is a **Next.js 15** application that provides a dashboard interface for browsing and interacting with Notion databases. Built with React 19, TypeScript, and modern tooling.

**Tech Stack:**

- **Framework**: Next.js 15 with App Router
- **React**: Version 19 with new compiler optimizations
- **UI**: shadcn/ui components with Radix primitives
- **Styling**: Tailwind CSS v4 with dark-mode-first design
- **State**: Zustand for global state management
- **Tables**: TanStack Table for data visualization with drag selection
- **Animations**: Framer Motion with spring physics
- **API**: Notion API integration via @notionhq/client

## Key Components Architecture

### State Management

- **Zustand Store** (`stores/databaseTableStore.ts`): Manages databases, pages, loading states, and row selection
- **TanStack Table integration**: Row selection state synchronized with Zustand
- **Stable references**: All table columns and data are memoized to prevent unnecessary re-renders

### Core Components

- **DatabaseCombobox**: Searchable dropdown for database selection
- **DatabaseTable**: Main table with sortable columns, row selection, and drag selection
- **DatabaseTableBodyRows**: Optimized row rendering component
- **DatabaseTableRow**: Individual row component with drag selection support

### API Routes

- **`/api/notion/databases`**: Fetches all accessible Notion databases
- **`/api/notion/databases/[databaseId]/pages`**: Fetches pages from specific database

## Performance Patterns

### Memoization Strategy (React 19 Compatible)

- **Column definitions**: Always memoized with useMemo and empty dependency array
- **Table options**: Stable references using useMemo with proper dependencies
- **Selection calculations**: Memoized to prevent expensive recalculations
- **Event handlers**: useCallback for drag selection and mouse events

### Table Performance

- **Drag selection**: Custom implementation with mouse event handling
- **Row virtualization**: Not implemented but can be added for large datasets
- **Selection state optimization**: Bulk selection operations with range support

## UI/UX Guidelines

### Design Language

- **Minimalism & Clarity**: Clean, uncluttered interface with generous whitespace
- **Developer Focus**: Monospaced fonts, code-friendly typography
- **Dark Mode First**: Primary theme with monochrome palette and strategic accents
- **Grid-Based Layouts**: Structured, ordered layouts throughout

### Animation Standards

- **Timing**: Maximum 0.3s for most animations, typically 0.2s
- **Easing**: Prefer `ease-out` for UI interactions, custom cubic-bezier curves
- **Performance**: Use only `transform` and `opacity`, avoid animating expensive properties
- **Accessibility**: Respect `prefers-reduced-motion` media query

## Development Patterns

### Component Structure

- **Arrow functions**: Always use for component definitions
- **Type inference**: Let TypeScript infer return types
- **shadcn/ui pattern**: UI components follow copy-paste pattern in `components/ui/`
- **Compound components**: Composition-based design with CVA for variants

### TypeScript Conventions

- **Interface naming**: PascalCase with descriptive suffixes
- **Type definitions**: Comprehensive Notion API types in `types/notion.ts`
- **Environment types**: Defined in `types/env.d.ts`

### State Updates

- **Zustand actions**: Functional updates for complex state changes
- **Row selection**: Synchronized between TanStack Table and Zustand
- **Loading states**: Proper error boundaries and loading indicators

## Notion API Integration

### Setup Requirements

1. Create Notion integration at https://www.notion.so/my-integrations
2. Add `NOTION_API_KEY` to `.env.local`
3. Grant database access by adding integration to each Notion database

### Data Flow

1. App loads → Fetch all databases via `/api/notion/databases`
2. User selects database → Fetch pages via `/api/notion/databases/[id]/pages`
3. Display in table with selection capabilities
4. Row selection managed in Zustand store

### Error Handling

- **API errors**: Proper HTTP status codes and error messages
- **Rate limiting**: Notion API rate limit handling
- **Authentication**: Unauthorized access detection and user feedback

## Files Structure Context

- **`app/`**: Next.js App Router pages and API routes
- **`components/`**: Reusable UI components (shadcn/ui and custom)
- **`stores/`**: Zustand state management
- **`types/`**: TypeScript type definitions
- **`hooks/`**: Custom React hooks
- **`lib/`**: Utility functions
- **`spec/`**: Design and development specifications
- **`docs/`**: API documentation
