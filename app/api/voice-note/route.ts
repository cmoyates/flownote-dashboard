import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4.1-mini"),
    messages: convertToModelMessages(messages),
    system: `
        You are a helpful assistant that cleans up transcriptions. 
        Please remove any unnecessary filler words, pauses, or repetitions from the transcription. 
        Your response should be in markdown format with an H1 at the top acting as the title of the transcription.
        The title should be concise and relevant to the content of the transcription.
        The content should be clear and easy to read, maintaining the original meaning while improving clarity.
    `,
  });

  return result.toUIMessageStreamResponse();
}
