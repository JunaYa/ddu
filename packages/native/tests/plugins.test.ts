import { afterEach, expect, test } from "vite-plus/test";
import {
  appVersion,
  autostart,
  confirm,
  permissionStatus,
  pickDirectory,
  requestPermission,
  restartApp,
} from "../src/index.ts";
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

test("permission commands map to the Rust commands", async () => {
  const mock = mockNative({
    window: "startup",
    commands: {
      permission_status: () => ({
        screenRecording: "denied",
        accessibility: "granted",
        microphone: "denied",
      }),
      permission_request: ({ kind }) => kind === "accessibility",
      restart_app: () => undefined,
    },
    plugins: { "plugin:app|version": () => "0.1.9" },
  });
  await expect(permissionStatus()).resolves.toMatchObject({ screenRecording: "denied" });
  await expect(requestPermission("accessibility")).resolves.toBe(true);
  await restartApp();
  await expect(appVersion()).resolves.toBe("0.1.9");
  expect(mock.calls.map(([cmd]) => cmd)).toEqual([
    "permission_status",
    "permission_request",
    "restart_app",
    "plugin:app|version",
  ]);
});
