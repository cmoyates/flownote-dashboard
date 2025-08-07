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

export const CommandMenu = () => {
  const [open, setOpen] = useState(false);
  const { pages, setRowSelection, rowSelection } = useDatabaseTableStore();

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

  const selectedRowsCount = Object.keys(rowSelection).length;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {selectedRowsCount > 0 && (
          <>
            <CommandGroup heading="Actions">
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    // Log selected pages
                    const selectedPages = pages.filter(
                      (_, index) => rowSelection[index] === true
                    );
                    console.log("Selected notion pages:", selectedPages);

                    // Also show a brief notification
                    // alert(
                    //   `Logged ${selectedPages.length} selected page(s) to console. Check DevTools > Console.`
                    // );
                  })
                }
              >
                <span>Log Selected Pages ({selectedRowsCount})</span>
                <CommandShortcut>⌘L</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    // Clear all selections
                    setRowSelection({});
                  })
                }
              >
                <span>Clear Selections ({selectedRowsCount})</span>
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
                  '[role="combobox"]'
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
