import { afterEach, expect, test } from "vite-plus/test";
import { cancelCapture, captureSession, finalizeCapture, hitTest } from "../src/index.ts";
import { mockNative, resetNativeMock } from "../src/testing.ts";

afterEach(resetNativeMock);

test("capture commands forward their arguments", async () => {
  const session = {
    mode: "auto" as const,
    axAvailable: true,
    monitor: { x: -246, y: -1080, w: 1920, h: 1080 },
    scaleFactor: 2,
    snapshotDataUrl: "data:image/png;base64,AAAA",
  };
  const mock = mockNative({
    window: "capture",
    commands: {
      smart_capture_get_session: () => session,
      smart_capture_hit_test: () => ({ chain: [], appName: "Finder" }),
      smart_capture_finalize: () => undefined,
      smart_capture_cancel: () => undefined,
    },
  });
  await expect(captureSession()).resolves.toEqual(session);
  await expect(hitTest(10, -20)).resolves.toEqual({ chain: [], appName: "Finder" });
  await finalizeCapture({ x: 1, y: 2, w: 3, h: 4 });
  await cancelCapture();
  expect(mock.calls.map(([cmd]) => cmd)).toEqual([
    "smart_capture_get_session",
    "smart_capture_hit_test",
    "smart_capture_finalize",
    "smart_capture_cancel",
  ]);
  expect(mock.calls[1]?.[1]).toEqual({ x: 10, y: -20 });
  expect(mock.calls[2]?.[1]).toEqual({ x: 1, y: 2, w: 3, h: 4 });
});
