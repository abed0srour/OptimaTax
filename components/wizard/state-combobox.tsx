"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { states } from "@/lib/taxData";
import { cn } from "@/lib/utils";

/**
 * State picker with type-ahead. Each item is searchable by full name and by
 * postal code, so "NY" and "new y" both land on New York.
 */
export function StateCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = states.find((state) => state.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-12 w-full justify-between gap-2 rounded-xl px-4 text-[0.95rem] font-medium"
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{selected.name}</span>
              <span className="shrink-0 text-xs font-normal text-muted-foreground">
                {selected.code}
              </span>
            </span>
          ) : (
            <span className="truncate text-muted-foreground">
              Search for your state…
            </span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="State or code — NY, Texas…" />
          <CommandList>
            <CommandEmpty>No state found.</CommandEmpty>
            {states.map((state) => (
              <CommandItem
                key={state.code}
                // cmdk searches this string, so the code is matchable too.
                value={`${state.name} ${state.code}`}
                onSelect={() => {
                  onChange(state.code);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "size-4",
                    state.code === value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{state.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {state.code}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
