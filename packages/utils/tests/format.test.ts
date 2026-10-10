import { expect, test } from "vite-plus/test";
import { formatFileSize, formatTime } from "../src/index.ts";

test("formatFileSize uses decimal units when asked, as the history window does", () => {
  expect(formatFileSize(0, { binary: false })).toBe("0 B");
  expect(formatFileSize(1234, { binary: false })).toBe("1.23 KB");
  expect(formatFileSize(1536)).toBe("1.5 KiB");
});

test("formatTime substitutes unpadded date and time parts", () => {
  expect(formatTime(new Date(2026, 9, 9, 7, 5, 3), "YYYY-MM-DD HH:mm:ss")).toBe("2026-10-9 7:5:3");
});
