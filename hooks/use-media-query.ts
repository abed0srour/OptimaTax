"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks a CSS media query from JS.
 *
 * `useSyncExternalStore` rather than state-in-an-effect: matchMedia is an
 * external store, and this way the server snapshot is explicit (always false)
 * instead of being a first render that an effect then corrects.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onStoreChange);
      return () => list.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
