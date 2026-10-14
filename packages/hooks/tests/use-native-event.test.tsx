import { emitNative, mockNative, resetNativeMock } from "@ddu/native/testing";
import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, expect, test, vi } from "vite-plus/test";
import { useNativeEvent } from "../src/index.ts";

afterEach(resetNativeMock);

const payload = {
  filename: "screenshot_1.png",
  fullPath: "/shots/images/screenshot_1.png",
  width: 1,
  height: 1,
  mode: "region",
  capturedAt: "2026-10-10T00:00:00Z",
  copyError: null,
};

test("useNativeEvent calls the latest handler and unsubscribes on unmount", async () => {
  mockNative({ window: "preview" });
  const first = vi.fn();
  const second = vi.fn();
  const { rerender, unmount } = renderHook(
    ({ handler }) => useNativeEvent("image-prepared", handler),
    {
      initialProps: { handler: first },
    },
  );
  await act(async () => {});

  rerender({ handler: second });
  await act(() => emitNative("image-prepared", payload));
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledWith(payload);

  unmount();
  await act(() => emitNative("image-prepared", payload));
  expect(second).toHaveBeenCalledTimes(1);
});

test("under StrictMode an event is delivered once despite the double mount", async () => {
  mockNative({ window: "preview" });
  const handler = vi.fn();
  renderHook(() => useNativeEvent("image-prepared", handler), { wrapper: StrictMode });
  await act(async () => {});
  await act(() => emitNative("image-prepared", payload));
  expect(handler).toHaveBeenCalledTimes(1);
});
