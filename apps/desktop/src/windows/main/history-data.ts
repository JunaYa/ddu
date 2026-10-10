import { fileTimes, imageDataUrl, listHistoryItems, searchHistoryText } from "@ddu/native";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export const historyKeys = {
  list: ["history"] as const,
  search: (query: string) => ["history", "search", query] as const,
  image: (path: string) => ["history", "image", path] as const,
  times: (path: string) => ["history", "times", path] as const,
};

/** The history, read once when the window opens and after changes made here. */
export function useHistoryItems() {
  return useQuery({ queryKey: historyKeys.list, queryFn: listHistoryItems });
}

/**
 * Ids of screenshots whose indexed text matches `query`, or `null` when no
 * search is active. Results are keyed by query, so a slow response for an
 * older keystroke can never replace a newer one.
 */
export function useTextSearch(query: string): Set<string> | null {
  const active = query.trim();
  const result = useQuery({
    queryKey: historyKeys.search(active),
    queryFn: async () => new Set(await searchHistoryText(active)),
    enabled: active.length > 0,
    placeholderData: (previous) => previous,
  });
  if (!active) return null;
  return result.data ?? new Set();
}

export function useImage(path: string) {
  return useQuery({
    queryKey: historyKeys.image(path),
    queryFn: () => imageDataUrl(path),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useFileTimes(path: string) {
  return useQuery({ queryKey: historyKeys.times(path), queryFn: () => fileTimes(path) });
}

/** `value`, updated only after it has been stable for `delayMs`. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
