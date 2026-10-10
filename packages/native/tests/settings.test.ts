import { afterEach, expect, test, vi } from "vite-plus/test";
import { getSetting, onSettingChange, setSetting, settingKeys } from "../src/index.ts";
import { mockNative, resetNativeMock } from "../src/testing.ts";

afterEach(() => {
  resetNativeMock();
  vi.restoreAllMocks();
});

test("the schema defines exactly the keys stored in settings.json (N2)", () => {
  expect([...settingKeys].sort()).toEqual(
    [
      "capture_delay",
      "first_run",
      "history_cleanup_enabled",
      "history_retention_days",
      "hotkey_fullscreen",
      "hotkey_region",
      "hotkey_text",
      "hotkey_window",
      "include_cursor",
      "naming_template",
      "ocr_index_enabled",
      "screenshot_path",
    ].sort(),
  );
});

test("getSetting reads the { value } shape Rust writes", async () => {
  mockNative({ settings: { include_cursor: { value: true } } });
  await expect(getSetting("include_cursor")).resolves.toBe(true);
});

test("getSetting falls back to the default for a missing key", async () => {
  mockNative();
  await expect(getSetting("capture_delay")).resolves.toBe(0);
  await expect(getSetting("ocr_index_enabled")).resolves.toBe(true);
});

test("getSetting falls back to the default and warns on invalid stored data", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  mockNative({ settings: { capture_delay: { value: "three" }, include_cursor: true } });
  await expect(getSetting("capture_delay")).resolves.toBe(0);
  await expect(getSetting("include_cursor")).resolves.toBe(false);
  expect(warn).toHaveBeenCalledTimes(2);
});

test("setSetting persists the value in the { value } shape (N4)", async () => {
  const mock = mockNative();
  await setSetting("hotkey_region", "CmdOrCtrl+Shift+R");
  expect(mock.settings.get("hotkey_region")).toEqual({ value: "CmdOrCtrl+Shift+R" });
  expect(mock.calls.map(([cmd]) => cmd)).toContain("plugin:store|save");
});

test("setSetting rejects values outside the schema without writing", async () => {
  const mock = mockNative();
  await expect(setSetting("capture_delay", -1)).rejects.toThrow();
  expect(mock.settings.has("capture_delay")).toBe(false);
});

test("onSettingChange observes writes from other windows until unsubscribed", async () => {
  const mock = mockNative();
  const handler = vi.fn();
  const off = await onSettingChange("include_cursor", handler);

  await mock.externalWrite("include_cursor", { value: true });
  expect(handler).toHaveBeenLastCalledWith(true);

  await mock.externalWrite("capture_delay", { value: 5 });
  expect(handler).toHaveBeenCalledTimes(1);

  off();
  await mock.externalWrite("include_cursor", { value: false });
  expect(handler).toHaveBeenCalledTimes(1);
});
