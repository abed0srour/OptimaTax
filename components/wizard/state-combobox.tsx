"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
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
import { useMediaQuery } from "@/hooks/use-media-query";
import { states } from "@/lib/taxData";
import { cn } from "@/lib/utils";

/**
 * State picker with type-ahead. Each item is searchable by full name and by
 * postal code, so "NY" and "new y" both land on New York.
 *
 * On phones this opens as a centred dialog rather than a popover: a 300px list
 * anchored to a trigger halfway down a short viewport has nowhere to go, and
 * Radix resolves that by flipping it above the field, which reads as a bug.
 */
export function StateCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const selected = states.find((state) => state.code === value);

  const list = (
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
  );

  const trigger = (props?: React.ComponentProps<typeof Button>) => (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="h-12 w-full justify-between gap-2 rounded-xl px-3.5 text-[0.95rem] font-medium"
      {...props}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <MapPin className="size-4 shrink-0 text-muted-foreground" />
        {selected ? (
          <>
            <span className="truncate">{selected.name}</span>
            <span className="shrink-0 text-xs font-normal text-muted-foreground">
              {selected.code}
            </span>
          </>
        ) : (
          <span className="truncate text-muted-foreground">
            Search for your state…
          </span>
        )}
      </span>
      <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
    </Button>
  );

  if (!isDesktop) {
    return (
      <>
        {trigger({ onClick: () => setOpen(true) })}
        <CommandDialog
          open={open}
          onOpenChange={setOpen}
          title="Choose your state"
          description="Search by state name or postal code."
          className="top-16 max-h-[75vh] translate-y-0"
        >
          {list}
        </CommandDialog>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger()}</PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
        sideOffset={6}
      >
        {list}
      </PopoverContent>
    </Popover>
  );
}
