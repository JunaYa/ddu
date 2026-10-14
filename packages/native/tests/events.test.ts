import { emit } from "@tauri-apps/api/event";
import { afterEach, expect, test, vi } from "vite-plus/test";
import { on } from "../src/index.ts";
import { mockNative, resetNativeMock } from "../src/testing.ts";

afterEach(resetNativeMock);

const payload = {
  filename: "screenshot_1.png",
  fullPath: "/shots/images/screenshot_1.png",
  width: 10,
  height: 20,
  mode: "region",
  capturedAt: "2026-10-10T00:00:00Z",
  copyError: null,
};

test("on delivers the payload until unsubscribed", async () => {
  mockNative({ window: "preview" });
  const handler = vi.fn();
  const off = await on("image-prepared", handler);

  await emit("image-prepared", payload);
  expect(handler).toHaveBeenCalledWith(payload);

  off();
  await emit("image-prepared", payload);
  expect(handler).toHaveBeenCalledTimes(1);
});
