import { mockNative, resetNativeMock } from "@ddu/native/testing";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vite-plus/test";
import { ImageEditor } from "../src/windows/preview/editor/image-editor.tsx";

const controller = vi.hoisted(() => ({
  getState: () => ({
    currentTool: "select",
    style: { strokeColor: "#ff0000", strokeWidth: 3 },
    canUndo: true,
    canRedo: true,
    restoring: false,
  }),
  initCanvas: vi.fn(),
  loadImage: vi.fn(async () => {}),
  setTool: vi.fn(),
  destroy: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  deleteSelected: vi.fn(),
  clearAnnotations: vi.fn(),
  updateStyle: vi.fn(),
  exportImage: () => "data:image/png;base64,EDITED",
  selectedImageRegion: () => ({ x: 10, y: 20, width: 30, height: 40 }),
  imageRectToCanvas: () => ({ x: 1, y: 2, width: 3, height: 4 }),
}));
vi.mock("../src/windows/preview/editor/editor.ts", () => ({ createEditor: () => controller }));
afterEach(() => {
  cleanup();
  resetNativeMock();
  vi.clearAllMocks();
});

test("copy and save send flattened bytes through the existing native commands", async () => {
  const onSaved = vi.fn();
  const mock = mockNative({
    commands: {
      copy_image_bytes: () => undefined,
      save_annotated_image: () => "/shots/edited.png",
    },
  });
  render(
    <ImageEditor
      imagePath="/shots/source.png"
      imageSrc="data:image/png;base64,ORIGINAL"
      onClose={() => {}}
      onSaved={onSaved}
    />,
  );
  const copy = screen.getByRole("button", { name: "复制编辑后的截图 Copy edited screenshot" });
  await waitFor(() => expect(copy.hasAttribute("disabled")).toBe(false));
  fireEvent.click(copy);
  await screen.findByText("已复制到剪贴板");
  expect(mock.calls).toContainEqual(["copy_image_bytes", { base64: "EDITED" }]);
  fireEvent.click(screen.getByRole("button", { name: "保存编辑副本 Save edited copy" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith("/shots/edited.png"));
  expect(mock.calls).toContainEqual([
    "save_annotated_image",
    { base64: "EDITED", sourcePath: "/shots/source.png" },
  ]);
});

test("failed save keeps the editor open and reports the error", async () => {
  const onSaved = vi.fn();
  mockNative({
    commands: {
      save_annotated_image: () => {
        throw "disk full";
      },
    },
  });
  render(
    <ImageEditor
      imagePath="/shots/source.png"
      imageSrc="source"
      onClose={() => {}}
      onSaved={onSaved}
    />,
  );
  const save = screen.getByRole("button", { name: "保存编辑副本 Save edited copy" });
  await waitFor(() => expect(save.hasAttribute("disabled")).toBe(false));
  fireEvent.click(save);
  expect((await screen.findByRole("alert")).textContent).toContain("disk full");
  expect(onSaved).not.toHaveBeenCalled();
  expect(save.hasAttribute("disabled")).toBe(false);
});

test("OCR recognizes the selected image region and exposes line highlights", async () => {
  const mock = mockNative({
    commands: {
      perform_ocr: () => ({
        text: "Text",
        language: "en",
        engine: "test",
        blocks: [{ text: "Text", x: 10, y: 20, width: 30, height: 40, confidence: 1 }],
      }),
    },
  });
  render(
    <ImageEditor
      imagePath="/shots/source.png"
      imageSrc="source"
      onClose={() => {}}
      onSaved={() => {}}
    />,
  );
  const ocr = screen.getByRole("button", { name: "提取文字 Extract text" });
  await waitFor(() => expect(ocr.hasAttribute("disabled")).toBe(false));
  fireEvent.click(ocr);
  const line = await screen.findByTitle("复制此行 1");
  fireEvent.mouseEnter(line);
  expect(screen.getByTestId("ocr-highlight")).toBeTruthy();
  expect(mock.calls).toContainEqual([
    "perform_ocr",
    { path: "/shots/source.png", region: { x: 10, y: 20, width: 30, height: 40 } },
  ]);
});

test("imported images automatically recognize the whole image and can retry after failure", async () => {
  let fail = true;
  const mock = mockNative({
    commands: {
      perform_ocr: () => {
        if (fail) throw "unavailable";
        return { text: "Imported text", language: "en", engine: "test", blocks: [] };
      },
    },
  });
  render(
    <ImageEditor
      imagePath="/shots/import.png"
      imageSrc="source"
      autoOcr
      onClose={() => {}}
      onSaved={() => {}}
    />,
  );
  expect((await screen.findByRole("alert")).textContent).toContain("unavailable");
  expect(mock.calls).toContainEqual(["perform_ocr", { path: "/shots/import.png", region: null }]);
  fail = false;
  fireEvent.click(screen.getByRole("button", { name: "提取文字 Extract text" }));
  await screen.findByText("Imported text");
});

test("closing the OCR panel discards an in-flight result", async () => {
  let finish!: (value: { text: string; language: string; engine: string; blocks: [] }) => void;
  mockNative({
    commands: {
      perform_ocr: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    },
  });
  render(
    <ImageEditor
      imagePath="/shots/import.png"
      imageSrc="source"
      autoOcr
      onClose={() => {}}
      onSaved={() => {}}
    />,
  );
  await screen.findByText("正在识别…");
  fireEvent.click(screen.getByRole("button", { name: "关闭文字面板 Close text panel" }));
  await act(async () => {
    finish({ text: "Stale text", language: "en", engine: "test", blocks: [] });
  });
  expect(screen.queryByText("Stale text")).toBeNull();
  expect(screen.queryByRole("complementary")).toBeNull();
});
