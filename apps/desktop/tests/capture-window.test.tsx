import type { CaptureSession } from "@ddu/native";
import { mockNative, type MockNativeOptions, resetNativeMock } from "@ddu/native/testing";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vite-plus/test";
import { WindowErrorBoundary } from "../src/shared/error-boundary.tsx";
import { CaptureWindow, HIT_TEST_THROTTLE_MS } from "../src/windows/capture/capture-window.tsx";
import { installEscapeToCancel } from "../src/windows/capture/escape-to-cancel.ts";

afterEach(() => {
  cleanup();
  resetNativeMock();
  vi.restoreAllMocks();
});

const monitor = { x: -246, y: -1080, w: 1920, h: 1080 };
const chain = [
  { rect: { x: -200, y: -1000, w: 120, h: 40 }, role: "AXButton", label: "OK" },
  { rect: { x: -240, y: -1060, w: 600, h: 400 }, role: "AXWindow", label: "Dialog" },
];

function setup(session: Partial<CaptureSession> = {}, options: MockNativeOptions = {}) {
  const mock = mockNative({
    window: "capture",
    ...options,
    commands: {
      smart_capture_get_session: () => ({
        mode: "auto",
        axAvailable: true,
        monitor,
        scaleFactor: 2,
        snapshotDataUrl: "data:image/png;base64,AAAA",
        ...session,
      }),
      smart_capture_hit_test: () => ({ chain, appName: "Finder" }),
      smart_capture_finalize: () => undefined,
      smart_capture_cancel: () => undefined,
      permission_request: () => true,
      ...options.commands,
    },
  });
  render(<CaptureWindow />);
  return mock;
}

const called = (mock: { calls: Array<[string, unknown]> }, cmd: string) =>
  mock.calls.filter(([name]) => name === cmd);
const overlay = () => screen.getByTestId("capture-overlay");

async function hover(x = 50, y = 90) {
  await waitFor(() => expect(overlay().querySelector("img")).toBeTruthy());
  fireEvent.mouseMove(overlay(), { clientX: x, clientY: y });
  return screen.findByText("120 × 40 · Finder · AXButton");
}

test("hovering hit-tests the global point and labels the deepest element", async () => {
  const mock = setup();
  await hover(50, 90);
  expect(called(mock, "smart_capture_hit_test")[0]?.[1]).toEqual({ x: -196, y: -990 });
});

test("a click captures the highlighted element", async () => {
  const mock = setup();
  await hover();
  fireEvent.mouseDown(overlay(), { button: 0, clientX: 50, clientY: 90 });
  fireEvent.mouseUp(overlay(), { clientX: 50, clientY: 90 });
  await waitFor(() =>
    expect(called(mock, "smart_capture_finalize")[0]?.[1]).toEqual(chain[0]?.rect),
  );
});

test("a drag captures the dragged rect in global coordinates", async () => {
  const mock = setup();
  await waitFor(() => expect(overlay().querySelector("img")).toBeTruthy());
  fireEvent.mouseDown(overlay(), { button: 0, clientX: 100, clientY: 100 });
  fireEvent.mouseMove(overlay(), { clientX: 300, clientY: 250 });
  expect(await screen.findByText("200 × 150")).toBeTruthy();
  fireEvent.mouseUp(overlay(), { clientX: 300, clientY: 250 });
  await waitFor(() =>
    expect(called(mock, "smart_capture_finalize")[0]?.[1]).toEqual({
      x: -146,
      y: -980,
      w: 200,
      h: 150,
    }),
  );
});

test("the wheel widens to the parent element", async () => {
  setup();
  await hover();
  fireEvent.wheel(overlay(), { deltaY: -1 });
  expect(await screen.findByText("600 × 400 · Finder · AXWindow")).toBeTruthy();
});

test("window mode starts at the outermost element", async () => {
  setup({ mode: "window" });
  await waitFor(() => expect(overlay().querySelector("img")).toBeTruthy());
  fireEvent.mouseMove(overlay(), { clientX: 50, clientY: 90 });
  expect(await screen.findByText("600 × 400 · Finder · AXWindow")).toBeTruthy();
});

test("Enter captures the highlighted element", async () => {
  const mock = setup();
  await hover();
  fireEvent.keyDown(window, { key: "Enter" });
  await waitFor(() => expect(called(mock, "smart_capture_finalize")).toHaveLength(1));
});

test("Escape cancels from outside React, and keeps working after a render crash", async () => {
  const mock = mockNative({
    window: "capture",
    commands: { smart_capture_cancel: () => undefined },
  });
  const uninstall = installEscapeToCancel();
  vi.spyOn(console, "error").mockImplementation(() => {});
  function Broken(): never {
    throw new Error("render failed");
  }
  let crashed = 0;
  render(
    <WindowErrorBoundary onError={() => crashed++}>
      <Broken />
    </WindowErrorBoundary>,
  );
  expect(crashed).toBe(1);
  fireEvent.keyDown(window, { key: "Escape" });
  await waitFor(() => expect(called(mock, "smart_capture_cancel")).toHaveLength(1));
  uninstall();
});

test("a missing session cancels the overlay", async () => {
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});
  const mock = setup(
    {},
    {
      commands: {
        smart_capture_get_session: () => {
          throw "no active capture session";
        },
      },
    },
  );
  await waitFor(() => expect(called(mock, "smart_capture_cancel")).toHaveLength(1));
  expect(logged).toHaveBeenCalledWith("no capture session:", expect.anything());
});

test("the Accessibility hint requests the permission without capturing", async () => {
  const mock = setup({ axAvailable: false });
  const hint = await screen.findByRole("button", { name: "开启辅助功能可识别页面模块" });
  fireEvent.mouseDown(hint, { button: 0 });
  fireEvent.mouseUp(hint);
  fireEvent.click(hint);
  await waitFor(() =>
    expect(called(mock, "permission_request")).toEqual([
      ["permission_request", { kind: "accessibility" }],
    ]),
  );
  expect(called(mock, "smart_capture_finalize")).toHaveLength(0);
});

test("text mode explains what the selection is for", async () => {
  setup({ mode: "text" });
  expect(
    await screen.findByText("框选区域以复制文字 Select an area to copy its text"),
  ).toBeTruthy();
});

test("hit tests are throttled and never overlap", async () => {
  let now = 1000;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  let release: (() => void) | undefined;
  const mock = setup(
    {},
    {
      commands: {
        smart_capture_hit_test: () =>
          new Promise((resolve) => {
            release = () => resolve({ chain, appName: "Finder" });
          }),
      },
    },
  );
  await waitFor(() => expect(overlay().querySelector("img")).toBeTruthy());
  fireEvent.mouseMove(overlay(), { clientX: 10, clientY: 10 });
  await waitFor(() => expect(called(mock, "smart_capture_hit_test")).toHaveLength(1));

  // Still in flight: dropped even though the throttle window has passed.
  now += HIT_TEST_THROTTLE_MS + 10;
  fireEvent.mouseMove(overlay(), { clientX: 20, clientY: 20 });
  expect(called(mock, "smart_capture_hit_test")).toHaveLength(1);

  release?.();
  await screen.findByText("120 × 40 · Finder · AXButton");
  // Back to the last call's timestamp + less than the window: dropped.
  now = 1000 + HIT_TEST_THROTTLE_MS - 1;
  fireEvent.mouseMove(overlay(), { clientX: 30, clientY: 30 });
  expect(called(mock, "smart_capture_hit_test")).toHaveLength(1);
  // Past the window and nothing in flight: sent.
  now = 1000 + HIT_TEST_THROTTLE_MS;
  fireEvent.mouseMove(overlay(), { clientX: 40, clientY: 40 });
  await waitFor(() => expect(called(mock, "smart_capture_hit_test")).toHaveLength(2));
});

test("a press that wiggles less than the drag threshold still captures the element", async () => {
  const mock = setup();
  await hover();
  fireEvent.mouseDown(overlay(), { button: 0, clientX: 50, clientY: 90 });
  fireEvent.mouseMove(overlay(), { clientX: 53, clientY: 92 });
  fireEvent.mouseUp(overlay(), { clientX: 53, clientY: 92 });
  await waitFor(() =>
    expect(called(mock, "smart_capture_finalize")[0]?.[1]).toEqual(chain[0]?.rect),
  );
});

test("hovering the same element again keeps the wheel-chosen level", async () => {
  setup();
  await hover(50, 90);
  fireEvent.wheel(overlay(), { deltaY: -1 });
  await screen.findByText("600 × 400 · Finder · AXWindow");
  await new Promise((resolve) => setTimeout(resolve, HIT_TEST_THROTTLE_MS + 10));
  fireEvent.mouseMove(overlay(), { clientX: 52, clientY: 91 });
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(screen.getByText("600 × 400 · Finder · AXWindow")).toBeTruthy();
});

test("the wheel never scrolls the frozen screen", async () => {
  setup();
  await hover();
  const event = new WheelEvent("wheel", { deltaY: -1, bubbles: true, cancelable: true });
  overlay().dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
});

test("a failed finalize leaves the overlay usable", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  let attempts = 0;
  const mock = setup(
    {},
    {
      commands: {
        smart_capture_finalize: () => {
          attempts++;
          if (attempts === 1) throw "capture failed";
        },
      },
    },
  );
  await hover();
  fireEvent.keyDown(window, { key: "Enter" });
  await waitFor(() => expect(called(mock, "smart_capture_finalize")).toHaveLength(1));
  fireEvent.keyDown(window, { key: "Enter" });
  await waitFor(() => expect(called(mock, "smart_capture_finalize")).toHaveLength(2));
});
