import { mockNative, resetNativeMock } from "@ddu/native/testing";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "vite-plus/test";
import { WindowShell } from "../src/shared/mount-window.tsx";
import { PermissionWindow } from "../src/windows/permission/permission-window.tsx";
import { PermissionsSection } from "../src/windows/setting/sections/permissions.tsx";

afterEach(() => {
  cleanup();
  resetNativeMock();
  window.history.replaceState({}, "", "/");
});
function setup(kind = "accessibility", bundle = true) {
  window.history.replaceState({}, "", `/?kind=${kind}`);
  const status = { accessibility: "denied", screenRecording: "denied", microphone: "undetermined" };
  const mock = mockNative({
    window: "permission",
    commands: {
      permission_status: () => ({ ...status }),
      permission_app_path: () => {
        if (!bundle) throw "请打开打包后的 DDU.app";
        return "/Applications/DDU.app";
      },
      permission_drag_app: () => undefined,
      permission_open_settings: () => undefined,
      permission_request: () => false,
    },
  });
  return { status, mock };
}
test("settings lets users manage granted and missing permissions", async () => {
  const { mock, status } = setup();
  status.accessibility = "granted";
  render(
    <WindowShell>
      <PermissionsSection />
    </WindowShell>,
  );
  expect(await screen.findByText("已授权")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "管理辅助功能权限" }));
  await waitFor(() =>
    expect(mock.calls).toContainEqual(["permission_request", { kind: "accessibility" }]),
  );
  expect(screen.getByRole("button", { name: "管理麦克风权限" })).toBeTruthy();
});
test("dragging the bundle invokes native drag and refreshes a subsequent grant", async () => {
  const { mock, status } = setup();
  render(
    <WindowShell>
      <PermissionWindow />
    </WindowShell>,
  );
  const item = await screen.findByRole("button", { name: "拖拽 DDU 到系统权限列表" });
  await waitFor(() => expect(item.getAttribute("draggable")).toBe("true"));
  fireEvent.dragStart(item);
  await waitFor(() => expect(mock.calls).toContainEqual(["permission_drag_app", {}]));
  status.accessibility = "granted";
  expect(await screen.findByText("辅助功能已授权", {}, { timeout: 2500 })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "打开系统设置" }));
  await waitFor(() =>
    expect(mock.calls).toContainEqual(["permission_open_settings", { kind: "accessibility" }]),
  );
});
test("unbundled builds cannot drag a different installed app", async () => {
  setup("accessibility", false);
  render(
    <WindowShell>
      <PermissionWindow />
    </WindowShell>,
  );
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "请打开打包后的 DDU.app");
  expect(
    screen.getByRole("button", { name: "拖拽 DDU 到系统权限列表" }).hasAttribute("disabled"),
  ).toBe(true);
});
test("microphone guidance does not offer unsupported file dragging", async () => {
  const { mock } = setup("microphone");
  render(
    <WindowShell>
      <PermissionWindow />
    </WindowShell>,
  );
  expect(await screen.findByText(/麦克风不支持拖拽添加/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "拖拽 DDU 到系统权限列表" })).toBeNull();
  expect(mock.calls.some(([cmd]) => cmd === "permission_app_path")).toBe(false);
});
