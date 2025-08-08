# Next.js + Vercel AI SDK: Push-to-Talk Transcription (TypeScript + Bun)

**Goal:** Add a “press to speak → transcribe → show text” flow in an App Router Next.js app using the **Vercel AI SDK** with **OpenAI** transcription models (e.g. `gpt-4o-mini-transcribe`). ([AI SDK][1], [OpenAI Platform][2])

---

## Implementation Plan (for the coding agent)

### 0) Prereqs & packages

- Assumes **App Router** project, TypeScript, local dev.
- **Environment:** `OPENAI_API_KEY` already configured (e.g. `.env.local`).
- **Install (Bun):**

  ```bash
  bun add ai @ai-sdk/openai
  ```

  (Vercel’s AI SDK provides a unified, type-safe interface; `@ai-sdk/openai` is the provider.) ([Vercel][3], [AI SDK][1])

---

### 1) Add a client UI to record audio and call the API

Create `app/page.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" }); // WebM/Opus
    chunksRef.current = [];
    mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const form = new FormData();
      form.append("audio", blob, "recording.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      setTranscript(data.text ?? "(no text)");

      // stop mic tracks
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <button onClick={recording ? stop : start}>
        {recording ? "Stop" : "Press to speak"}
      </button>
      <pre style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{transcript}</pre>
    </main>
  );
}
```

**Why this works:** browsers produce **WebM/Opus** via `MediaRecorder`, which OpenAI accepts for STT; it’s a compact format and easy to ship to your API route as `multipart/form-data`. ([OpenAI Platform][4])

---

### 2) Add a server route to transcribe with Vercel AI SDK

Create `app/api/transcribe/route.ts`:

```ts
import { NextResponse } from "next/server";
import { experimental_transcribe as transcribe } from "ai";
import { openai } from "@ai-sdk/openai";

export const runtime = "nodejs"; // ensure Node runtime for multipart + Buffer

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  // Options: 'gpt-4o-mini-transcribe', 'gpt-4o-transcribe', or 'whisper-1'
  const result = await transcribe({
    model: openai.transcription("gpt-4o-mini-transcribe"),
    audio: audioBuffer,
    // Example: per-provider options (timestamps, language hints, etc.)
    // providerOptions: { openai: { timestampGranularities: ['word'] } }
  });

  return NextResponse.json({ text: result.text });
}
```

- `experimental_transcribe` is the AI SDK helper for speech-to-text; you pass a provider’s **transcription model** and the audio bytes, and it returns normalized output (`text`, etc.). ([AI SDK][5])
- Use **Node runtime** for easy `Buffer` and multipart parsing in route handlers. ([Next.js][6])
- OpenAI **models** for STT include `gpt-4o-mini-transcribe` (modern, fast, accurate) and `whisper-1` (classic). ([OpenAI Platform][2])

---

### 3) Wire up env (already set)

Ensure your runtime has `OPENAI_API_KEY` (AI SDK’s OpenAI provider reads this by default). ([Vercel][7])

---

### 4) Run locally (Bun)

```bash
bun run dev
# visit http://localhost:3000
```

Press the button, speak, then press **Stop**. The transcript should render in the `<pre>`.

---

## Options & tweaks

- **Switching models:** swap to `openai.transcription('whisper-1')` if you prefer Whisper; or `gpt-4o-transcribe` for the bigger omni model. Both are supported by the guide’s flow. ([OpenAI Platform][4])
- **Prompts / biasing:** OpenAI STT supports an optional **prompt** to bias recognition (domain terms, names). You can pass provider options via `providerOptions.openai`. ([OpenAI Platform][4])
- **Realtime (streaming) STT:** For incremental captions, use OpenAI’s **Realtime Transcription** with `gpt-4o(-mini)-transcribe`. That’s a different, streaming flow—useful later if you want live partials. ([OpenAI Platform][8])
- **Other formats:** If you must use WAV/PCM instead of WebM/Opus, record differently client-side, but the server code remains the same (send bytes → `transcribe`). OpenAI’s audio guide covers supported formats. ([OpenAI Platform][9])

---

## File layout (App Router)

```
app/
  api/
    transcribe/
      route.ts
  page.tsx
```

Next.js **Route Handlers** support `POST` and `formData()` natively in App Router. ([Next.js][10])

---

## Acceptance criteria (have the agent verify)

1. `bun add ai @ai-sdk/openai` installed; `OPENAI_API_KEY` available at runtime. ([Vercel][3])
2. `app/page.tsx` has a **Press to speak / Stop** button, records mic with `MediaRecorder`, sends `multipart/form-data` to `/api/transcribe`.
3. `app/api/transcribe/route.ts` uses `experimental_transcribe` with `openai.transcription('gpt-4o-mini-transcribe')` (or `whisper-1`) and returns `{ text }`. ([AI SDK][5])
4. Local dev: start with `bun run dev`; speaking and stopping renders transcript in the UI.
5. Route handler runs in **Node** runtime (explicit export or default), and no Edge-only APIs are used. ([Next.js][6])

---

## Troubleshooting

- **`formData()` empty / file missing:** ensure the client is sending `multipart/form-data` with a `File` object (the example uses `FormData.append('audio', blob, 'recording.webm')`). App Router route handlers read `formData()` on the `Request` object. ([Next.js][10])
- **Unsupported mime:** use `audio/webm` (Opus) in browsers with MediaRecorder; or record WAV and update filename accordingly. ([OpenAI Platform][9])
- **Edge runtime errors (no Buffer):** set `export const runtime = 'nodejs'` in the route file. ([Next.js][6])

---

## Notes

- AI SDK 5 introduced the **experimental** transcription surface across providers—it’s normal that the API lives under `experimental_transcribe` right now. Expect some evolution in options/telemetry. ([Vercel][11])

---

[1]: https://ai-sdk.dev/docs/introduction?utm_source=chatgpt.com "AI SDK by Vercel"
[2]: https://platform.openai.com/docs/models/gpt-4o-mini-transcribe?utm_source=chatgpt.com "GPT-4o mini Transcribe"
[3]: https://vercel.com/docs/ai-sdk?utm_source=chatgpt.com "AI SDK"
[4]: https://platform.openai.com/docs/guides/speech-to-text?utm_source=chatgpt.com "Speech to text - OpenAI API"
[5]: https://ai-sdk.dev/docs/ai-sdk-core/transcription?utm_source=chatgpt.com "AI SDK Core: Transcription"
[6]: https://nextjs.org/docs/app/api-reference/edge?utm_source=chatgpt.com "API Reference: Edge Runtime"
[7]: https://vercel.com/docs/ai/openai?utm_source=chatgpt.com "Vercel & OpenAI Integration"
[8]: https://platform.openai.com/docs/guides/realtime-transcription?utm_source=chatgpt.com "Realtime transcription - OpenAI API"
[9]: https://platform.openai.com/docs/guides/audio?utm_source=chatgpt.com "Audio and speech - OpenAI API"
[10]: https://nextjs.org/docs/app/api-reference/file-conventions/route?utm_source=chatgpt.com "File-system conventions: route.js"
[11]: https://vercel.com/blog/ai-sdk-5?utm_source=chatgpt.com "AI SDK 5"
