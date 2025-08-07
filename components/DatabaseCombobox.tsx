"use client";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDatabaseTableStore } from "@/stores/databaseTableStore";
import { useState, useCallback, useMemo } from "react";

const DatabaseCombobox = () => {
  const [open, setOpen] = useState(false);
  const { allDatabases, activeDatabaseID, setActiveDatabaseID } =
    useDatabaseTableStore();

  const activeDatabase = useMemo(
    () => allDatabases.find((database) => database.id === activeDatabaseID),
    [allDatabases, activeDatabaseID],
  );

  const handleSelect = useCallback(
    (databaseId: string) => {
      setActiveDatabaseID(databaseId === activeDatabaseID ? "" : databaseId);
      setOpen(false);
    },
    [activeDatabaseID, setActiveDatabaseID],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {activeDatabase ? activeDatabase.title : "Select database..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search database..." />
          <CommandList>
            <CommandEmpty>No database found.</CommandEmpty>
            <CommandGroup>
              {allDatabases.map((database) => (
                <CommandItem
                  key={database.id}
                  value={database.title}
                  onSelect={() => handleSelect(database.id)}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      activeDatabaseID === database.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {database.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DatabaseCombobox;
