import type { CaptureSession } from "@ddu/native";
import { mockNative, type MockNativeOptions, resetNativeMock } from "@ddu/native/testing";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vite-plus/test";
import { WindowShell } from "../src/shared/mount-window.tsx";
import { CaptureWindow } from "../src/windows/capture/capture-window.tsx";

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
  render(
    <WindowShell>
      <CaptureWindow />
    </WindowShell>,
  );
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

test("Escape cancels and Enter captures the highlighted element", async () => {
  const mock = setup();
  await hover();
  fireEvent.keyDown(window, { key: "Enter" });
  await waitFor(() => expect(called(mock, "smart_capture_finalize")).toHaveLength(1));
  fireEvent.keyDown(window, { key: "Escape" });
  await waitFor(() => expect(called(mock, "smart_capture_cancel")).toHaveLength(1));
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
