import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vite-plus/test";
import { OcrPanel } from "../src/windows/preview/editor/ocr-panel.tsx";
afterEach(cleanup);
test("OCR supports merged copy, individual lines and image hover highlights", () => {
  const onCopy = vi.fn(),
    onHover = vi.fn(),
    onClose = vi.fn();
  render(
    <OcrPanel
      state={{
        loading: false,
        error: "",
        partial: true,
        lines: [{ text: "Hello" }, { text: "world" }],
      }}
      onCopy={onCopy}
      onHover={onHover}
      onClose={onClose}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "复制全部" }));
  expect(onCopy).toHaveBeenLastCalledWith("Hello\nworld");
  fireEvent.click(screen.getByRole("checkbox", { name: "合并换行" }));
  fireEvent.click(screen.getByRole("button", { name: "复制全部" }));
  expect(onCopy).toHaveBeenLastCalledWith("Hello world");
  fireEvent.mouseEnter(screen.getByRole("button", { name: "world" }));
  expect(onHover).toHaveBeenLastCalledWith(1);
  fireEvent.click(screen.getByRole("button", { name: "world" }));
  expect(onCopy).toHaveBeenLastCalledWith("world");
  fireEvent.click(screen.getByRole("button", { name: "关闭文字面板 Close text panel" }));
  expect(onClose).toHaveBeenCalledOnce();
});
