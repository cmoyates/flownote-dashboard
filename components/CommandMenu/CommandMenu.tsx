"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useDatabaseTableStore } from "@/stores/databaseTableStore";
import { convertPagesToMarkdown } from "@/lib/notion-markdown";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";
import type { NotionPage } from "@/types/notion";

export const CommandMenu = () => {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordingToastIdRef = useRef<string | number | null>(null);
  const activeDatabaseIDRef = useRef<string>("");

  const {
    pages,
    setRowSelection,
    rowSelection,
    selectedRowCount,
    activeDatabaseID,
  } = useDatabaseTableStore();

  // Keep the latest DB ID in a ref to avoid stale closures in callbacks
  useEffect(() => {
    activeDatabaseIDRef.current = activeDatabaseID;
  }, [activeDatabaseID]);

  const { sendMessage } = useChat({
    onFinish: (message) => {
      const lastPart = message.message.parts[message.message.parts.length - 1];
      if (lastPart.type === "text") {
        console.log(lastPart.text);
      }
    },
  });

  const { sendMessage: sendVoiceNote } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/voice-note",
    }),
    onFinish: async (message) => {
      const lastPart = message.message.parts[message.message.parts.length - 1];
      if (lastPart.type === "text") {
        // Ensure we have an active Notion database selected
        const dbId = activeDatabaseIDRef.current;

        if (!dbId) {
          toast.error("Select a Notion database first.");
          return;
        }

        try {
          const res = await fetch(`/api/notion/databases/${dbId}/pages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markdown: lastPart.text }),
          });

          // if (!res.ok) {
          //   const err = await res.json().catch(() => ({}));
          //   // Rollback optimistic row on failure
          //   useDatabaseTableStore.setState((s) => ({
          //     pages: s.pages.filter((p) => p.id !== tempId),
          //   }));
          //   throw new Error(err?.error || `Failed with status ${res.status}`);
          // }

          const data: { page?: { id: string; url?: string }; title?: string } =
            await res.json();

          // Replace optimistic with real page details

          const now = new Date();
          const isoNow = now.toISOString();

          const optimisticPage: NotionPage = {
            id: data.page?.id,
            url: data.page?.url,
            title: data.title,
            created_time: isoNow,
            last_edited_time: isoNow,
            created_by: {},
            last_edited_by: {},
            cover: null,
            icon: null,
            parent: { database_id: dbId } as unknown as NotionPage["parent"],
            archived: false,
            in_trash: false,
            properties: {},
          } as unknown as NotionPage;

          useDatabaseTableStore.setState((s) => ({
            pages: [optimisticPage, ...s.pages],
          }));

          // Optional: background refresh to ensure full sync with Notion (e.g., computed properties)
          try {
            const refreshed = await fetch(
              `/api/notion/databases/${dbId}/pages`,
            );
            if (refreshed.ok) {
              const freshData = await refreshed.json();
              useDatabaseTableStore.setState({ pages: freshData.pages });
            }
          } catch {}
          toast.success("Voice note saved to Notion.", {
            action: data.page?.url
              ? {
                  label: "Open",
                  onClick: () => window.open(data.page!.url!, "_blank"),
                }
              : undefined,
          });
        } catch (err) {
          console.error("Failed to save voice note to Notion:", err);
          toast.error("Failed to save voice note to Notion.");
        }
      }
    },
    onError: (error) => {
      console.error("Voice note processing error:", error);
      toast.error("Failed to process voice note. Please try again.");
    },
  });

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);

      // Dismiss the persistent recording toast
      if (recordingToastIdRef.current) {
        toast.dismiss(recordingToastIdRef.current);
        recordingToastIdRef.current = null;
      }

      toast.info("Recording stopped. Processing...");
    }
  }, [recording]);

  // Direct function for toast button that doesn't rely on useCallback closure
  const handleStopRecordingFromToast = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);

      // Dismiss the persistent recording toast
      if (recordingToastIdRef.current) {
        toast.dismiss(recordingToastIdRef.current);
        recordingToastIdRef.current = null;
      }

      toast.info("Recording stopped. Processing...");
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setTranscribing(true);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const form = new FormData();
        form.append("audio", blob, "recording.webm");

        try {
          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: form,
          });

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          const data = await res.json();
          const transcribedText = data.text ?? "(no text)";

          // Send the transcribed text to the voice note chat
          sendVoiceNote({
            text: `Please clean up the following transcription:\n\n${transcribedText}`,
          });

          toast.success("Audio transcribed and sent to voice note processor!");
        } catch (error) {
          console.error("Transcription failed:", error);
          toast.error("Failed to transcribe audio. Please try again.");
        } finally {
          setTranscribing(false);
        }

        // Stop mic tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);

      // Show persistent toast with stop recording button
      recordingToastIdRef.current = toast("Recording voice note...", {
        description: "Click 'Stop Recording' to finish or press ⌘R",
        action: {
          label: "Stop Recording",
          onClick: handleStopRecordingFromToast,
        },
        duration: Infinity,
        position: "bottom-right",
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  }, [sendVoiceNote]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Listen for the "/" key
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Prevent the "/" from being typed in input fields
        const target = e.target as HTMLElement;
        const isInInputField =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.contentEditable === "true";

        if (!isInInputField) {
          e.preventDefault();
          setOpen((open) => !open);
        }
      }
      // Also support Ctrl+K / Cmd+K as a secondary shortcut
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Voice recording shortcut (Cmd+R / Ctrl+R)
      if (e.key === "r" && (e.metaKey || e.ctrlKey)) {
        const target = e.target as HTMLElement;
        const isInInputField =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.contentEditable === "true";

        if (!isInInputField && !transcribing) {
          e.preventDefault();
          if (recording) {
            stopRecording();
          } else {
            startRecording();
          }
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [recording, transcribing, startRecording, stopRecording]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const runChatWithSelectedPages = async (prompt: string) => {
    // Get selected pages
    const selectedPages = pages.filter(
      (_, index) => rowSelection[index] === true,
    );

    if (selectedPages.length === 0) {
      console.log("No pages selected");
      return;
    }

    try {
      // Extract page IDs
      const pageIds = selectedPages.map((page) => page.id);

      // Convert pages to markdown
      const result = await convertPagesToMarkdown(pageIds);

      if (result.processedCount === 0) {
        console.error("No pages could be converted to markdown");
        return;
      }

      // Create the summarization prompt
      const markdownContent = Object.entries(result.data)
        .map(([pageId, markdown]) => {
          const pageName =
            selectedPages.find((p) => p.id === pageId)?.title || "Untitled";
          return `## ${pageName}\n\n${markdown}`;
        })
        .join("\n\n---\n\n");

      const chatPrompt = `${prompt}\n\n${markdownContent}`;

      sendMessage({
        text: chatPrompt,
      });
    } catch (error) {
      console.error(`Failed to run chat command ${prompt}:`, error);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {recording && (
          <>
            <CommandGroup heading="Active">
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    if (recording) {
                      stopRecording();
                    } else if (!transcribing) {
                      startRecording();
                    }
                  })
                }
                disabled={transcribing}
              >
                <span>
                  {recording
                    ? "Stop Recording Voice Note"
                    : transcribing
                      ? "Processing..."
                      : "Record Voice Note"}
                </span>
                <CommandShortcut>⌘R</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />
          </>
        )}

        {selectedRowCount > 0 && (
          <>
            <CommandGroup heading="Actions">
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    // Log selected pages
                    const selectedPages = pages.filter(
                      (_, index) => rowSelection[index] === true,
                    );
                    console.log("Selected notion pages:", selectedPages);

                    toast.success(
                      `Logged ${selectedPages.length} selected page(s) to console.`,
                    );
                  })
                }
              >
                <span>Log Selected Pages ({selectedRowCount})</span>
                <CommandShortcut>⌘L</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(async () => {
                    // Get selected pages
                    const selectedPages = pages.filter(
                      (_, index) => rowSelection[index] === true,
                    );

                    if (selectedPages.length === 0) {
                      console.log("No pages selected");
                      return;
                    }

                    console.log(
                      `Converting ${selectedPages.length} selected page(s) to markdown...`,
                    );

                    try {
                      // Extract page IDs
                      const pageIds = selectedPages.map((page) => page.id);

                      // Convert pages to markdown
                      const result = await convertPagesToMarkdown(pageIds);

                      console.log(
                        Object.entries(result.data).map(([_, md]) => md),
                      );

                      // Log any errors
                      if (
                        result.errors &&
                        Object.keys(result.errors).length > 0
                      ) {
                        console.error("Conversion errors:", result.errors);
                      }

                      console.log(
                        `✅ Successfully converted ${result.processedCount} page(s) to markdown`,
                      );

                      toast.success(
                        `Converted ${result.processedCount} page(s) to markdown.`,
                      );
                      if (result.errorCount > 0) {
                        console.warn(
                          `⚠️ ${result.errorCount} page(s) failed to convert`,
                        );

                        toast.error(
                          `Failed to convert ${result.errorCount} page(s). Check console for details.`,
                        );
                      }
                    } catch (error) {
                      console.error(
                        "Failed to convert pages to markdown:",
                        error,
                      );

                      toast.error(
                        "Failed to convert pages to markdown. Check console for details.",
                      );
                    }
                  })
                }
              >
                <span>Test Markdown API ({selectedRowCount})</span>
                <CommandShortcut>⌘M</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(async () => {
                    // Run chat command with selected pages
                    await runChatWithSelectedPages(
                      "Summarize these Notion pages:",
                    );
                  })
                }
              >
                <span>Summarize Pages ({selectedRowCount})</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(async () => {
                    // Run chat command with selected pages
                    await runChatWithSelectedPages(
                      "Extract all tasks (todo items) from these notion pages and format them into a markdown task list:",
                    );
                  })
                }
              >
                <span>Extract Tasks from Pages ({selectedRowCount})</span>
                <CommandShortcut>⌘E</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    // Clear all selections
                    setRowSelection({});
                  })
                }
              >
                <span>Clear Selections ({selectedRowCount})</span>
                <CommandShortcut>⌘⌫</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />
          </>
        )}

        {!recording && (
          <>
            <CommandGroup heading="Voice">
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    if (recording) {
                      stopRecording();
                    } else if (!transcribing) {
                      startRecording();
                    }
                  })
                }
                disabled={transcribing}
              >
                <span>
                  {recording
                    ? "Stop Recording Voice Note"
                    : transcribing
                      ? "Processing..."
                      : "Record Voice Note"}
                </span>
                <CommandShortcut>⌘R</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                // Focus on database selector
                const combobox = document.querySelector(
                  '[role="combobox"]',
                ) as HTMLElement;
                if (combobox) {
                  combobox.click();
                }
              })
            }
          >
            <span>Select Database</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
