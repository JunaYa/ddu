import { mockNative, resetNativeMock } from "@ddu/native/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "vite-plus/test";
import { useSetting } from "../src/index.ts";
import { makeWrapper } from "./wrapper.tsx";

afterEach(resetNativeMock);

test("useSetting suspends until the stored value is loaded", async () => {
  mockNative({ settings: { include_cursor: { value: true } } });
  const { result } = renderHook(() => useSetting("include_cursor"), { wrapper: makeWrapper() });
  await waitFor(() => expect(result.current).not.toBeNull());
  expect(result.current[0]).toBe(true);
});

test("setValue updates immediately and persists in the { value } shape", async () => {
  const mock = mockNative();
  const { result } = renderHook(() => useSetting("capture_delay"), { wrapper: makeWrapper() });
  await waitFor(() => expect(result.current).not.toBeNull());

  await act(() => result.current[1](5));
  // React Query notifies components on a later tick than act() flushes.
  await waitFor(() => expect(result.current[0]).toBe(5));
  expect(mock.settings.get("capture_delay")).toEqual({ value: 5 });
  expect(result.current[2].error).toBeNull();
});

test("a rejected write rolls back and reports the error", async () => {
  const mock = mockNative({ settings: { capture_delay: { value: 3 } } });
  const { result } = renderHook(() => useSetting("capture_delay"), { wrapper: makeWrapper() });
  await waitFor(() => expect(result.current).not.toBeNull());

  await act(() => result.current[1](-1));
  await waitFor(() => expect(result.current[2].error).toBeInstanceOf(Error));
  expect(result.current[0]).toBe(3);
  expect(mock.settings.get("capture_delay")).toEqual({ value: 3 });
});

test("changes from another window are applied live", async () => {
  const mock = mockNative();
  const { result } = renderHook(() => useSetting("hotkey_region"), { wrapper: makeWrapper() });
  await waitFor(() => expect(result.current).not.toBeNull());
  expect(result.current[0]).toBe("CmdOrCtrl+Shift+S");

  await act(() => mock.externalWrite("hotkey_region", { value: "CmdOrCtrl+Shift+R" }));
  await waitFor(() => expect(result.current[0]).toBe("CmdOrCtrl+Shift+R"));
});

test("a change made before the subscription attached is still picked up", async () => {
  let raced = false;
  mockNative({
    settings: { include_cursor: { value: false } },
    // Right after the initial read is answered, another writer changes the
    // value without the event reaching us (no subscription exists yet).
    onStoreGet: (key, settings) => {
      if (key === "include_cursor" && !raced) {
        raced = true;
        settings.set("include_cursor", { value: true });
      }
    },
  });
  const { result } = renderHook(() => useSetting("include_cursor"), { wrapper: makeWrapper() });
  await waitFor(() => expect(result.current?.[0]).toBe(true));
});
