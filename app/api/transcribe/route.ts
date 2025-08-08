import { NextResponse } from "next/server";
import { experimental_transcribe as transcribe } from "ai";
import { openai } from "@ai-sdk/openai";

export const runtime = "nodejs"; // ensure Node runtime for multipart + Buffer

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("audio");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Use gpt-4o-mini-transcribe for fast, accurate transcription
    const result = await transcribe({
      model: openai.transcription("gpt-4o-mini-transcribe"),
      audio: audioBuffer,
      providerOptions: {
        openai: {
          prompt: process.env.STT_BASE_PROMPT ?? "",
        },
      },
    });

    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 },
    );
  }
}
