import type { PermissionStatus } from "@ddu/native";
import { mockNative, type MockNativeOptions, resetNativeMock } from "@ddu/native/testing";
import { focusManager } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "vite-plus/test";
import { WindowShell } from "../src/shared/mount-window.tsx";
import { StartupWindow } from "../src/windows/startup/startup-window.tsx";

afterEach(() => {
  cleanup();
  resetNativeMock();
  focusManager.setFocused(undefined);
});

function setup(initial: Partial<PermissionStatus> = {}, options: MockNativeOptions = {}) {
  const status: PermissionStatus = {
    screenRecording: "denied",
    accessibility: "denied",
    microphone: "denied",
    ...initial,
  };
  const mock = mockNative({
    window: "startup",
    plugins: { "plugin:app|version": () => "0.1.9" },
    ...options,
    commands: {
      permission_status: () => ({ ...status }),
      permission_request: () => false,
      restart_app: () => undefined,
      ...options.commands,
    },
  });
  render(
    <WindowShell>
      <StartupWindow />
    </WindowShell>,
  );
  return { mock, status };
}

const called = (mock: { calls: Array<[string, unknown]> }, cmd: string) =>
  mock.calls.filter(([name]) => name === cmd);

test("shows the version and each permission's state", async () => {
  setup({ accessibility: "granted" });
  expect(await screen.findByText("Ddu 版本: V0.1.9")).toBeTruthy();
  expect(await screen.findByRole("button", { name: "授权屏幕录制" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "授权辅助功能" })).toBeNull();
  expect(screen.getByText("已授权")).toBeTruthy();
});

test("requesting Screen Recording asks Rust and offers a restart while still denied", async () => {
  const { mock } = setup();
  fireEvent.click(await screen.findByRole("button", { name: "授权屏幕录制" }));

  await waitFor(() =>
    expect(called(mock, "permission_request")).toEqual([
      ["permission_request", { kind: "screenRecording" }],
    ]),
  );
  fireEvent.click(await screen.findByRole("button", { name: "重启应用" }));
  await waitFor(() => expect(called(mock, "restart_app")).toHaveLength(1));
});

test("requesting Accessibility does not offer a restart", async () => {
  const { mock } = setup();
  fireEvent.click(await screen.findByRole("button", { name: "授权辅助功能" }));
  await waitFor(() =>
    expect(called(mock, "permission_request")).toEqual([
      ["permission_request", { kind: "accessibility" }],
    ]),
  );
  expect(screen.queryByRole("button", { name: "重启应用" })).toBeNull();
});

test("a grant made in System Settings is picked up by the poll", async () => {
  const { status } = setup();
  expect(await screen.findByRole("button", { name: "授权屏幕录制" })).toBeTruthy();
  status.screenRecording = "granted";
  await waitFor(() => expect(screen.queryByRole("button", { name: "授权屏幕录制" })).toBeNull(), {
    timeout: 2500,
  });
});

test("a status failure is shown instead of the permission list", async () => {
  setup(
    {},
    {
      commands: {
        permission_status: () => {
          throw "TCC unavailable";
        },
      },
    },
  );
  // No retry delay: the poll already re-reads every second.
  expect(await screen.findByText(/无法读取权限状态/, undefined, { timeout: 500 })).toBeTruthy();
});

test("the restart offer appears only after requesting Screen Recording and goes once it is granted", async () => {
  const { status } = setup();
  expect(await screen.findByRole("button", { name: "授权屏幕录制" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "重启应用" })).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "授权屏幕录制" }));
  expect(await screen.findByRole("button", { name: "重启应用" })).toBeTruthy();

  status.screenRecording = "granted";
  await waitFor(() => expect(screen.queryByRole("button", { name: "重启应用" })).toBeNull(), {
    timeout: 2500,
  });
});

test("the status is re-read right after a request, without waiting for the poll", async () => {
  const { mock } = setup();
  fireEvent.click(await screen.findByRole("button", { name: "授权辅助功能" }));
  await waitFor(
    () => {
      const order = mock.calls.map(([cmd]) => cmd);
      const requested = order.indexOf("permission_request");
      expect(requested).toBeGreaterThanOrEqual(0);
      expect(order.slice(requested + 1)).toContain("permission_status");
    },
    { timeout: 300 },
  );
});

test("polling pauses while the window is hidden", async () => {
  const { mock } = setup();
  expect(await screen.findByRole("button", { name: "授权屏幕录制" })).toBeTruthy();
  focusManager.setFocused(false);
  const before = called(mock, "permission_status").length;
  await new Promise((resolve) => setTimeout(resolve, 1500));
  expect(called(mock, "permission_status")).toHaveLength(before);
});

test("a failed request is shown", async () => {
  setup(
    {},
    {
      commands: {
        permission_request: () => {
          throw "TCC refused";
        },
      },
    },
  );
  fireEvent.click(await screen.findByRole("button", { name: "授权辅助功能" }));
  expect(await screen.findByText("授权失败：TCC refused")).toBeTruthy();
});
