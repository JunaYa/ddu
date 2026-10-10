import {
  getSetting,
  onSettingChange,
  type SettingKey,
  type SettingValue,
  setSetting,
} from "@ddu/native";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

export const settingKeys = {
  all: ["setting"] as const,
  byKey: (key: SettingKey) => ["setting", key] as const,
};

export interface SettingStatus {
  /** A write is in flight. */
  isSaving: boolean;
  /** The last write failed; the value was rolled back. Cleared by the next write. */
  error: Error | null;
}

/**
 * Read and write one `settings.json` key. Suspends until the stored value is
 * loaded, so the value is never a placeholder. Writes are optimistic and
 * roll back on failure; changes from other windows or from Rust are applied
 * live.
 */
export function useSetting<K extends SettingKey>(
  key: K,
): [SettingValue<K>, (value: SettingValue<K>) => Promise<void>, SettingStatus] {
  const queryClient = useQueryClient();
  const queryKey = settingKeys.byKey(key);

  const { data } = useSuspenseQuery({
    queryKey,
    queryFn: () => getSetting(key),
    // Kept fresh by the change subscription below, never by refetching.
    staleTime: Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    let off: (() => void) | undefined;
    let active = true;
    void onSettingChange(key, (value) =>
      queryClient.setQueryData(settingKeys.byKey(key), value),
    ).then((unsubscribe) => {
      if (active) off = unsubscribe;
      else unsubscribe();
    });
    return () => {
      active = false;
      off?.();
    };
  }, [key, queryClient]);

  const mutation = useMutation<
    void,
    Error,
    SettingValue<K>,
    { previous: SettingValue<K> | undefined }
  >({
    mutationFn: (value) => setSetting(key, value),
    onMutate: async (value) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SettingValue<K>>(queryKey);
      queryClient.setQueryData(queryKey, value);
      return { previous };
    },
    onError: (_error, _value, context) => {
      if (context) queryClient.setQueryData(queryKey, context.previous);
    },
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
