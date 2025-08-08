// Environment variables type definitions
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NOTION_API_KEY: string;
      OPENAI_API_KEY: string;
      STT_BASE_PROMPT?: string;
      // Add other environment variables here as needed
    }
  }
}

export {};
