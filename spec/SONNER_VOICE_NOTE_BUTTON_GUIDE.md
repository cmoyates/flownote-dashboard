## Objective

Display a **persistent toast** in the bottom-right corner while voice recording is in progress, with an embedded **"Stop Recording"** button to dismiss it manually—and also allow external logic to dismiss it programmatically.

---

## Key API Features from Sonner

- `action`: lets you embed a custom button with `label` and `onClick` callback inside the toast. ([Shadcn UI][1], [react-hot-toast.com][2])
- `duration: Infinity`: ensures the toast remains visible until explicitly dismissed. ([Gunnar Torfi Steinarsson][3])
- `toast.dismiss(id)`: allows programmatic dismissal using the toast’s returned ID. ([npm][4])

---

## Example Guide Code

```ts
"use client";

import { Toaster, toast } from "sonner";

// Storage for the active toast ID
let recordingToastId: string | number;

export function RecordingToasterAgent() {
  // Initiates recording and shows the persistent toast
  function startRecording() {
    // (Insert voice recording logic here)

    recordingToastId = toast("Recording in progress", {
      description: "Click “Stop Recording” to finish",
      action: {
        label: "Stop Recording",
        onClick: () => stopRecording(),
      },
      duration: Infinity,
      position: "bottom-right",
    });
  }

  // Stops recording and dismisses the toast
  function stopRecording() {
    // (Insert stop-recording logic here)

    toast.dismiss(recordingToastId);
  }

  return (
    <>
      <Toaster />
      {/* Replace with your real trigger or connection into app flow */}
      <button onClick={startRecording}>Start Recording</button>
    </>
  );
}
```

---

## Summary for the AI Agent

| Feature              | Implementation                    |
| -------------------- | --------------------------------- |
| **Persistent toast** | `duration: Infinity`              |
| **Stop button**      | Provided via `action` option      |
| **Manual dismissal** | `toast.dismiss(recordingToastId)` |

---

[1]: https://ui.shadcn.com/docs/components/sonner?utm_source=chatgpt.com "Sonner - Shadcn UI"
[2]: https://react-hot-toast.com/docs/toast?utm_source=chatgpt.com "toast() API"
[3]: https://gunnartorfis.github.io/sonner-native/toast/?utm_source=chatgpt.com "toast() | sonner-native"
[4]: https://www.npmjs.com/package/sonner/v/0.6.0?utm_source=chatgpt.com "sonner - npm"
