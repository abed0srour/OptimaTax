"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { states } from "@/lib/taxData";
import type { StateTaxEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Most-relevant first: exact code, then name prefix, then anything containing it. */
function rank(state: StateTaxEntry, query: string): number {
  const name = state.name.toLowerCase();
  const code = state.code.toLowerCase();
  if (code === query) return 0;
  if (name.startsWith(query)) return 1;
  if (code.startsWith(query)) return 2;
  if (name.includes(query)) return 3;
  return 99;
}

const MAX_SUGGESTIONS = 6;

/**
 * A search field, not a dropdown: suggestions appear in the flow beneath the
 * input as you type, so there is no floating layer to collide with the viewport,
 * flip upward, or trap scrolling.
 */
export function StateSearch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
}) {
  const selected = states.find((state) => state.code === value);

  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const listId = useId();
  const inputId = useId();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return states
      .map((state) => ({ state, score: rank(state, q) }))
      .filter((entry) => entry.score < 99)
      .sort((a, b) => a.score - b.score || a.state.name.localeCompare(b.state.name))
      .slice(0, MAX_SUGGESTIONS)
      .map((entry) => entry.state);
  }, [query]);

  const showList = open && query.trim().length > 0;

  function commit(state: StateTaxEntry) {
    onChange(state.code);
    setQuery(state.name);
    setOpen(false);
    setActive(0);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList || matches.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + matches.length) % matches.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      commit(matches[active] ?? matches[0]);
    } else if (event.key === "Escape") {
      setOpen(false);
      // Drop the half-typed query so the field never shows a non-selection.
      setQuery(selected?.name ?? "");
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="text-[0.9rem] font-medium">
        {label}
      </Label>

      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={inputId}
          ref={inputRef}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && matches[active] ? `${listId}-${matches[active].code}` : undefined
          }
          placeholder="Search your state — California, NY…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={(event) => {
            event.target.select();
            if (query.trim()) setOpen(true);
          }}
          onBlur={() => {
            setOpen(false);
            // Restore the committed choice, so a stray query cannot linger and
            // imply a state that was never selected.
            setQuery(selected?.name ?? "");
          }}
          onKeyDown={onKeyDown}
          className="h-12 rounded-xl bg-card pr-3 pl-10 text-[0.95rem] font-medium md:text-[0.95rem]"
        />
      </div>

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching states"
          className="show-scrollbar max-h-60 overflow-y-auto overscroll-contain rounded-xl border border-border bg-card p-1"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">
              No state matches “{query.trim()}”.
            </li>
          ) : (
            matches.map((state, index) => {
              const isActive = index === active;
              const isSelected = state.code === value;

              return (
                <li key={state.code} role="none">
                  <button
                    type="button"
                    role="option"
                    id={`${listId}-${state.code}`}
                    aria-selected={isSelected}
                    // Fires before blur, so the click is never swallowed.
                    onMouseDown={(event) => {
                      event.preventDefault();
                      commit(state);
                    }}
                    onMouseEnter={() => setActive(index)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      isActive ? "bg-muted" : "bg-transparent",
                    )}
                  >
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {state.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {state.code}
                    </span>
                    {isSelected ? (
                      <Check className="size-4 shrink-0 text-primary" strokeWidth={3} />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

    </div>
  );
}
