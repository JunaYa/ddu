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

export interface TextSearch {
  /** Ids matching the query, or `null` when not filtering (no query, or no result yet). */
  matches: Set<string> | null;
  error: Error | null;
}

/**
 * Text search over the OCR index. Results are keyed by query, so a slow
 * response for an older keystroke can never replace a newer one. Until the
 * first result arrives (or if the search fails) nothing is filtered, as the
 * Vue page kept the full list visible.
 */
export function useTextSearch(query: string): TextSearch {
  const active = query.trim();
  const result = useQuery({
    queryKey: historyKeys.search(active),
    queryFn: async () => new Set(await searchHistoryText(active)),
    enabled: active.length > 0,
    placeholderData: (previous) => previous,
    // Always re-query, as before: the index changes whenever OCR runs.
    staleTime: 0,
  });
  if (!active) return { matches: null, error: null };
  return { matches: result.error ? null : (result.data ?? null), error: result.error };
}

export function useImage(path: string) {
  return useQuery({
    queryKey: historyKeys.image(path),
    queryFn: () => imageDataUrl(path),
    staleTime: Number.POSITIVE_INFINITY,
    // Full-size images are large; drop them soon after their card scrolls away.
    gcTime: 60 * 1000,
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
