import { emit } from "@tauri-apps/api/event";
import { mockNative, resetNativeMock } from "@ddu/native/testing";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vite-plus/test";
import { WindowShell } from "../src/shared/mount-window.tsx";
import { PreviewWindow } from "../src/windows/preview/preview-window.tsx";

vi.mock("../src/windows/preview/editor/image-editor.tsx", () => ({
  ImageEditor: () => <div>React image editor</div>,
}));
afterEach(() => {
  cleanup();
  resetNativeMock();
  vi.useRealTimers();
});
const capture = {
  filename: "shot.png",
  fullPath: "/custom/images/shot.png",
  width: 800,
  height: 600,
  mode: "region",
  capturedAt: "2026-10-15",
  copyError: null,
};
async function setup() {
  const mock = mockNative({
    window: "preview",
    commands: {
      get_image_base64: () => "QUJD",
      hide_preview_window: () => undefined,
      update_preview_window: () => undefined,
      copy_image_to_clipboard: () => undefined,
      perform_ocr: () => ({ text: "hello\n世界", language: "auto", engine: "test", blocks: [] }),
      copy_text: () => undefined,
    },
  });
  render(
    <WindowShell>
      <PreviewWindow />
    </WindowShell>,
  );
  await act(async () => {});
  await act(async () => {
    await emit("image-prepared", capture);
  });
  await screen.findByRole("img", { name: "截图预览" });
  return mock;
}

test("preview uses the guarded image command, copies images and OCR text", async () => {
  const mock = await setup();
  fireEvent.click(screen.getByRole("button", { name: "复制截图 Copy screenshot" }));
  await screen.findByText("已复制");
  expect(mock.calls).toContainEqual(["copy_image_to_clipboard", { path: capture.fullPath }]);
  fireEvent.click(screen.getByRole("button", { name: "提取并复制文字 Copy text" }));
  await screen.findByText("已复制 2 行文字");
  expect(mock.calls).toContainEqual(["copy_text", { text: "hello\n世界" }]);
});

test("editing expands the native window and renders the React editor", async () => {
  const mock = await setup();
  fireEvent.click(screen.getByRole("button", { name: "编辑截图 Edit screenshot" }));
  await screen.findByText("React image editor");
  expect(mock.calls.some(([cmd]) => cmd === "update_preview_window")).toBe(true);
});

test("preview hides after five idle seconds but pauses on hover", async () => {
  const mock = await setup();
  vi.useFakeTimers();
  fireEvent.mouseEnter(screen.getByRole("main"));
  await act(async () => {
    vi.advanceTimersByTime(6000);
  });
  expect(mock.calls.some(([cmd]) => cmd === "hide_preview_window")).toBe(false);
  fireEvent.mouseLeave(screen.getByRole("main"));
  await act(async () => {
    vi.advanceTimersByTime(5000);
  });
  expect(mock.calls.some(([cmd]) => cmd === "hide_preview_window")).toBe(true);
});

test("a new capture exits the editor and replaces its image", async () => {
  const mock = await setup();
  fireEvent.click(screen.getByRole("button", { name: "编辑截图 Edit screenshot" }));
  await screen.findByText("React image editor");
  await act(async () => {
    await emit("image-prepared", { ...capture, fullPath: "/custom/images/new.png" });
  });
  await screen.findByRole("img", { name: "截图预览" });
  expect(screen.queryByText("React image editor")).toBeNull();
  await waitFor(() =>
    expect(mock.calls).toContainEqual(["get_image_base64", { path: "/custom/images/new.png" }]),
  );
});
