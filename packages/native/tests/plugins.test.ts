import { afterEach, expect, test } from "vite-plus/test";
import { autostart, confirm, pickDirectory } from "../src/index.ts";
import { mockNative, resetNativeMock } from "../src/testing.ts";

afterEach(resetNativeMock);

test("autostart wraps the plugin's enable state", async () => {
  let enabled = false;
  mockNative({
    plugins: {
      "plugin:autostart|is_enabled": () => enabled,
      "plugin:autostart|enable": () => {
        enabled = true;
      },
    },
  });
  await expect(autostart.isEnabled()).resolves.toBe(false);
  await autostart.enable();
  await expect(autostart.isEnabled()).resolves.toBe(true);
});

test("pickDirectory opens a single-directory picker rooted at the home directory", async () => {
  const mock = mockNative({
    plugins: {
      "plugin:path|resolve_directory": () => "/Users/me",
      "plugin:dialog|open": () => "/Users/me/Shots",
    },
  });
  await expect(pickDirectory({ title: "选择目录" })).resolves.toBe("/Users/me/Shots");
  const open = mock.calls.find(([cmd]) => cmd === "plugin:dialog|open");
  expect(open?.[1]).toMatchObject({
    options: { directory: true, multiple: false, title: "选择目录", defaultPath: "/Users/me" },
  });
});

test("pickDirectory resolves null when the user cancels", async () => {
  mockNative({
    plugins: {
      "plugin:path|resolve_directory": () => "/Users/me",
      "plugin:dialog|open": () => null,
    },
  });
  await expect(pickDirectory({ title: "选择目录" })).resolves.toBeNull();
});

test("confirm is true only when the user presses OK", async () => {
  let answer = "Ok";
  mockNative({ plugins: { "plugin:dialog|message": () => answer } });
  await expect(confirm("清空？", { title: "确认", kind: "warning" })).resolves.toBe(true);
  answer = "Cancel";
  await expect(confirm("清空？", { title: "确认", kind: "warning" })).resolves.toBe(false);
});
