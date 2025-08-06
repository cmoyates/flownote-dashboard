# FlowNote Dashboard

## Architecture Overview

This is a **Next.js 15** AI chat application built for testing SpeechCatcher AI assistant features. The architecture follows:

- **Frontend**: React 19 + TypeScript with shadcn/ui components and Tailwind CSS v4
- **AI Integration**: Vercel AI SDK with Google Gemini 2.0 Flash model and custom tool integration
- **Backend**: Next.js API routes with LangSmith telemetry and Tavily search integration
- **Styling**: Dark-mode-first design with custom animations using Framer Motion

## Key Development Patterns

### Component Architecture

- **shadcn/ui pattern**: All UI components in `src/components/ui/` follow the copy-paste shadcn pattern
- **Compound components**: Card, Avatar, Button use slot-based composition with class-variance-authority
- **Custom animations**: Use Framer Motion with spring physics (see `src/components/chat/AnimatedText.tsx`)

### AI Chat Implementation

- **Streaming chat**: Uses `useChat` hook from `@ai-sdk/react` with streaming responses
- **Message handling**: Complex message parts system with tool invocations and streaming status

### State Management

- **Local persistence**: Chat history stored in localStorage with arrow key navigation
- **Form state**: Input handling with history navigation (up/down arrows) and editing detection
- **Streaming indicators**: Real-time status with character-by-character animated text
- **Zustand** for main state management

### Other library usage

- **Zod** for schema validation
- **shadcn/ui** for UI components
- **clsx** for conditional class names
- **notionhq/client** for Notion API integration
- **tanstack/react-table** for table management
- **sonner** for toast notifications

## Essential Conventions

### TypeScript

- **Arrow functions**: Always use arrow functions for component definitions
- **Type inference**: Don't explicitly provide return types; let TypeScript infer
- **Interface naming**: Use PascalCase with descriptive suffixes (e.g., `MessageCardProps`)

### Styling & Animation

- **Animation timing**: Follow `spec/ANIMATIONS.md` - max 0.3s for most animations, use spring physics
- **Design system**: Reference `spec/DESIGN_LANGUAGE.md` for minimalist, developer-focused principles
- **Dark mode**: Primary theme with monochrome palette and strategic accent colors
- **Custom easings**: Use specific cubic-bezier values defined in animations spec instead of CSS defaults

## Critical Development Workflows

### Development

```bash
bun dev  # Uses Turbopack for fast development
```

### Animation Implementation

- **Character animation**: Text appears character-by-character in exactly 0.3s total duration
- **Spring physics**: Use Framer Motion with specific stiffness/damping values
- **Fade transitions**: 0.2s fade-out before text changes, smooth spring fade-in

## External Dependencies & Integration

### AI SDK Stack

- **Model**: GPT 4.1-mini via `@ai-sdk/openai`
- **Streaming**: Built-in streaming
- **Telemetry**: LangSmith integration for monitoring and debugging

### UI Components

- **Radix primitives**: Foundation for accessible components (Avatar, ScrollArea, Accordion)
- **Lucide icons**: Consistent iconography throughout the application
- **Class composition**: `cn()` utility combines clsx and tailwind-merge for dynamic styling

## Performance Considerations

- **Turbopack**: Enabled for faster development builds
- **Animation optimization**: Uses transform/opacity only, hardware acceleration enabled
- **Message persistence**: localStorage for chat history with 10-message limit
- **Streaming**: Non-blocking UI updates during AI response generation

## Context7 Documentation Usage

- Use Context7 MCP server for library documentation
- Start with 5000 tokens, increase to 20000 if needed
- Maximum 3 searches per documentation query
- Essential for `ai`, `zod`, `shadcn-ui`, and other complex libraries
