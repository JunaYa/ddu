import {
  getSetting,
  onSettingChange,
  type SettingKey,
  type SettingValue,
  setSetting,
} from "@ddu/native";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

/** React Query keys for settings (distinct from @ddu/native's `settingKeys`, the key names). */
export const settingQueryKeys = {
  all: ["setting"] as const,
  byKey: (key: SettingKey) => ["setting", key] as const,
};

export interface SettingStatus {
  /** A write is in flight. */
  isSaving: boolean;
  /** The last write failed; the value was re-read from the store. Cleared by the next write. */
  error: Error | null;
}

/**
 * Read and write one `settings.json` key. Suspends until the stored value is
 * loaded, so the value is never a placeholder. Writes are optimistic; changes
 * from other windows or from Rust are applied live.
 */
export function useSetting<K extends SettingKey>(
  key: K,
): [SettingValue<K>, (value: SettingValue<K>) => Promise<void>, SettingStatus] {
  const queryClient = useQueryClient();
  const queryKey = settingQueryKeys.byKey(key);

  const { data } = useSuspenseQuery({
    queryKey,
    queryFn: () => getSetting(key),
    // Kept fresh by the change subscription below, never by refetching.
    staleTime: Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    const queryKey = settingQueryKeys.byKey(key);
    let off: (() => void) | undefined;
    let active = true;
    onSettingChange(key, (value) => queryClient.setQueryData(queryKey, value))
      .then((unsubscribe) => {
        if (!active) return unsubscribe();
        off = unsubscribe;
        // A change between the initial read and this subscription (or while
        // no component was subscribed) would otherwise never arrive.
        void queryClient.invalidateQueries({ queryKey });
      })
      .catch((error: unknown) =>
        console.error(`Live updates for setting "${key}" unavailable`, error),
      );
    return () => {
      active = false;
      off?.();
    };
  }, [key, queryClient]);

  const mutation = useMutation<void, Error, SettingValue<K>>({
    mutationFn: (value) => setSetting(key, value),
    onMutate: async (value) => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, value);
    },
    // Re-read rather than restore a snapshot: a failed save may still have
    // updated Rust's in-memory store, and a later write may already be shown.
    onError: () => queryClient.invalidateQueries({ queryKey }),
  });

  const { mutateAsync } = mutation;
  const setValue = useCallback(
    async (value: SettingValue<K>) => {
      // The failure is reported through `status.error`; callers need not catch.
      await mutateAsync(value).catch(() => undefined);
    },
    [mutateAsync],
  );

  return [data, setValue, { isSaving: mutation.isPending, error: mutation.error }];
}
