import { afterEach, expect, test } from "vite-plus/test";
import { currentWindowLabel, isWindowLabel, WINDOW } from "../src/index.ts";
import { mockNative, resetNativeMock } from "../src/testing.ts";

afterEach(resetNativeMock);

test("currentWindowLabel returns the window the code runs in", () => {
  mockNative({ window: "setting" });
  expect(currentWindowLabel()).toBe(WINDOW.setting);
});

test("currentWindowLabel rejects windows ddu does not define", () => {
  mockNative({ window: "devtools" });
  expect(() => currentWindowLabel()).toThrow("Unknown window label: devtools");
});

test("isWindowLabel accepts exactly the five window labels", () => {
  expect(Object.values(WINDOW).every(isWindowLabel)).toBe(true);
  expect(isWindowLabel("index")).toBe(false);
});
