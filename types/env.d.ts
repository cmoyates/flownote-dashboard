// Environment variables type definitions
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NOTION_API_KEY: string;
      // Add other environment variables here as needed
    }
  }
}

export {};
