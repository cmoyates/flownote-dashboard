"use client";

import { useEffect, useState } from "react";
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
import { toast } from "sonner";

export const CommandMenu = () => {
  const [open, setOpen] = useState(false);
  const { pages, setRowSelection, rowSelection, selectedRowCount } =
    useDatabaseTableStore();

  const { sendMessage } = useChat({
    onFinish: (message) => {
      const lastPart = message.message.parts[message.message.parts.length - 1];
      if (lastPart.type === "text") {
        console.log(lastPart.text);
      }
    },
  });

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
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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
