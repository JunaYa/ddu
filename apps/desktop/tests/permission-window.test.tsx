import { mockNative, resetNativeMock } from "@ddu/native/testing";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vite-plus/test";
import { WindowShell } from "../src/shared/mount-window.tsx";
import { PermissionWindow } from "../src/windows/permission/permission-window.tsx";
import { PermissionsSection } from "../src/windows/setting/sections/permissions.tsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  resetNativeMock();
  window.history.replaceState({}, "", "/");
});
function setup(kind = "accessibility", bundle = true) {
  window.history.replaceState({}, "", `/?kind=${kind}`);
  const status = { accessibility: "denied", screenRecording: "denied", microphone: "undetermined" };
  const mock = mockNative({
    window: "permission",
    plugins: { "plugin:window|close": () => undefined },
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
  const item = await screen.findByRole("button", {
    name: "DDU：点击打开系统设置，或拖拽到权限列表",
  });
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
  const { mock } = setup("accessibility", false);
  render(
    <WindowShell>
      <PermissionWindow />
    </WindowShell>,
  );
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "请打开打包后的 DDU.app");
  const card = screen.getByRole("button", { name: "DDU：点击打开系统设置，或拖拽到权限列表" });
  expect(card.getAttribute("draggable")).toBe("false");
  fireEvent.click(card);
  await waitFor(() =>
    expect(mock.calls).toContainEqual(["permission_open_settings", { kind: "accessibility" }]),
  );
});
test("microphone guidance does not offer unsupported file dragging", async () => {
  const { mock } = setup("microphone");
  render(
    <WindowShell>
      <PermissionWindow />
    </WindowShell>,
  );
  expect(await screen.findByText(/麦克风不支持拖拽添加/)).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: "DDU：点击打开系统设置，或拖拽到权限列表" }),
  ).toBeNull();
  expect(mock.calls.some(([cmd]) => cmd === "permission_app_path")).toBe(false);
});

test.each(["accessibility", "screenRecording"])(
  "clicking the granted %s card opens its settings pane",
  async (kind) => {
    const { mock, status } = setup(kind);
    Object.assign(status, { [kind]: "granted" });
    render(
      <WindowShell>
        <PermissionWindow />
      </WindowShell>,
    );
    const card = await screen.findByRole("button", {
      name: "DDU：点击打开系统设置，或拖拽到权限列表",
    });
    fireEvent.click(card);
    await waitFor(() => expect(mock.calls).toContainEqual(["permission_open_settings", { kind }]));
    expect(await screen.findByText(/权限已开启/)).toBeTruthy();
    expect(mock.calls.some(([cmd]) => cmd === "permission_request")).toBe(false);
  },
);

test("a drag does not also navigate, but the next click does", async () => {
  const { mock } = setup();
  render(
    <WindowShell>
      <PermissionWindow />
    </WindowShell>,
  );
  const card = await screen.findByRole("button", {
    name: "DDU：点击打开系统设置，或拖拽到权限列表",
  });
  await waitFor(() => expect(card.getAttribute("draggable")).toBe("true"));
  fireEvent.dragStart(card);
  await waitFor(() => expect(mock.calls).toContainEqual(["permission_drag_app", {}]));
  await waitFor(() => expect(card.hasAttribute("disabled")).toBe(false));
  fireEvent.click(card, { detail: 1 });
  expect(mock.calls.some(([cmd]) => cmd === "permission_open_settings")).toBe(false);
  fireEvent.pointerDown(card);
  fireEvent.click(card, { detail: 1 });
  await waitFor(() =>
    expect(mock.calls).toContainEqual(["permission_open_settings", { kind: "accessibility" }]),
  );
});

test("the whole panel opens settings and Escape closes without navigating", async () => {
  const { mock } = setup();
  render(
    <WindowShell>
      <PermissionWindow />
    </WindowShell>,
  );
  const panel = screen.getByRole("button", { name: "点击面板打开系统设置" });
  fireEvent.click(panel);
  await waitFor(() =>
    expect(mock.calls.filter(([cmd]) => cmd === "permission_open_settings")).toHaveLength(1),
  );
  fireEvent.keyDown(window, { key: "Escape" });
  await waitFor(() => expect(mock.calls.some(([cmd]) => cmd === "plugin:window|close")).toBe(true));
  expect(mock.calls.filter(([cmd]) => cmd === "permission_open_settings")).toHaveLength(1);
});

test("close remains independent of the panel settings action", async () => {
  const { mock } = setup();
  render(
    <WindowShell>
      <PermissionWindow />
    </WindowShell>,
  );
  fireEvent.click(screen.getByRole("button", { name: "关闭授权引导" }));
  await waitFor(() => expect(mock.calls.some(([cmd]) => cmd === "plugin:window|close")).toBe(true));
  expect(mock.calls.some(([cmd]) => cmd === "permission_open_settings")).toBe(false);
});

test.each([false, true])("pointer entrance respects reduced motion=%s", async (reduce) => {
  vi.stubGlobal("matchMedia", () => ({ matches: reduce }));
  const { mock } = setup();
  render(
    <WindowShell>
      <PermissionsSection />
    </WindowShell>,
  );
  const button = screen.getByRole("button", { name: "管理辅助功能权限" });
  vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
    x: 100,
    y: 200,
    width: 80,
    height: 40,
  } as DOMRect);
  fireEvent.click(button, { detail: 1 });
  await waitFor(() =>
    expect(mock.calls).toContainEqual([
      "permission_request",
      reduce ? { kind: "accessibility" } : { kind: "accessibility", origin: { x: 140, y: 220 } },
    ]),
  );
});
