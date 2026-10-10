import { type EventMap, on } from "@ddu/native";
import { useEffect, useRef } from "react";

/**
 * Subscribe to a Rust event for the component's lifetime. The latest
 * `handler` is always called, so it need not be memoized.
 */
export function useNativeEvent<K extends keyof EventMap>(
  name: K,
  handler: (payload: EventMap[K]) => void,
): void {
  const latest = useRef(handler);
  latest.current = handler;

  useEffect(() => {
    let off: (() => void) | undefined;
    let active = true;
    void on(name, (payload) => latest.current(payload)).then((unsubscribe) => {
      if (active) off = unsubscribe;
      else unsubscribe();
    });
    return () => {
      active = false;
      off?.();
    };
  }, [name]);
}
