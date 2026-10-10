import { type EventMap, on } from "@ddu/native";
import { useEffect, useEffectEvent } from "react";

/**
 * Subscribe to a Rust event for the component's lifetime. The latest
 * `handler` is always called, so it need not be memoized.
 */
export function useNativeEvent<K extends keyof EventMap>(
  name: K,
  handler: (payload: EventMap[K]) => void,
): void {
  const onEvent = useEffectEvent(handler);

  useEffect(() => {
    let off: (() => void) | undefined;
    let active = true;
    on(name, (payload) => onEvent(payload))
      .then((unsubscribe) => {
        if (active) off = unsubscribe;
        else unsubscribe();
      })
      .catch((error: unknown) => console.error(`Subscribing to "${name}" failed`, error));
    return () => {
      active = false;
      off?.();
    };
  }, [name]);
}
