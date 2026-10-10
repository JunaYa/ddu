import { mockNative, type MockNativeOptions, resetNativeMock } from "@ddu/native/testing";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test } from "vite-plus/test";
import { WindowShell } from "../src/shared/mount-window.tsx";
import { SettingWindow } from "../src/windows/setting/setting-window.tsx";

afterEach(() => {
  // No Vitest globals, so Testing Library cannot unmount between tests itself.
  cleanup();
  resetNativeMock();
});

const diagnostics = {
  app_version: "0.1.9",
  os: "macos",
  os_version: "26.0",
  arch: "aarch64",
  permissions: [{ key: "screenRecording", status: "available", reason: null }],
  capabilities: [{ key: "ocr", status: "limited", reason: "Local PP-OCRv6" }],
};

function setup(options: MockNativeOptions = {}) {
  let autostartOn = false;
  const dialogAnswers: string[] = [];
  const mock = mockNative({
    ...options,
    plugins: {
      "plugin:autostart|is_enabled": () => autostartOn,
      "plugin:autostart|enable": () => {
        autostartOn = true;
      },
      "plugin:autostart|disable": () => {
        autostartOn = false;
      },
      "plugin:path|resolve_directory": () => "/Users/me",
      "plugin:dialog|open": () => "/Users/me/Shots",
      "plugin:dialog|message": () => dialogAnswers.shift() ?? "Cancel",
      ...options.plugins,
    },
    commands: {
      apply_shortcuts: () => undefined,
      clear_ocr_index: () => undefined,
      list_history_items: () => [],
      delete_history_items: ({ paths }) => paths.length,
      get_diagnostics_bundle: () => diagnostics,
      ...options.commands,
    },
  });
  render(
    <WindowShell>
      <SettingWindow />
    </WindowShell>,
  );
  return { mock, answerNextDialog: (answer: "Ok" | "Cancel") => dialogAnswers.push(answer) };
}

const called = (mock: { calls: Array<[string, unknown]> }, cmd: string) =>
  mock.calls.filter(([name]) => name === cmd);

test("renders every section from stored settings", async () => {
  setup({
    settings: { screenshot_path: { value: "/Users/me/Desktop" }, include_cursor: { value: true } },
  });
  expect(await screen.findByText("开机自动启动")).toBeTruthy();
  expect(screen.getByText("已选择目录: /Users/me/Desktop")).toBeTruthy();
  expect(screen.getByRole("switch", { name: "Include Cursor" }).getAttribute("aria-checked")).toBe(
    "true",
  );
  for (const title of ["Capture", "Shortcuts", "截图历史", "本机诊断"]) {
    expect(screen.getByText(title)).toBeTruthy();
  }
});

test("general: toggling autostart enables launch at login", async () => {
  const { mock } = setup();
  fireEvent.click(await screen.findByRole("switch", { name: "开机自动启动" }));
  await waitFor(() => expect(called(mock, "plugin:autostart|enable")).toHaveLength(1));
  await waitFor(() =>
    expect(screen.getByRole("switch", { name: "开机自动启动" }).getAttribute("aria-checked")).toBe(
      "true",
    ),
  );
});

test("storage: choosing a directory stores it", async () => {
  const { mock } = setup({ settings: { screenshot_path: { value: "/Users/me/Desktop" } } });
  fireEvent.click(await screen.findByRole("button", { name: "选择目录" }));
  await waitFor(() =>
    expect(mock.settings.get("screenshot_path")).toEqual({ value: "/Users/me/Shots" }),
  );
  expect(await screen.findByText("已选择目录: /Users/me/Shots")).toBeTruthy();
});

test("capture: delay, cursor and naming template are written in the { value } shape", async () => {
  const { mock } = setup();
  fireEvent.click(await screen.findByRole("button", { name: "5s" }));
  fireEvent.click(screen.getByRole("switch", { name: "Include Cursor" }));
  const naming = screen.getByRole("textbox", { name: "File Naming" });
  fireEvent.change(naming, { target: { value: "{date}_{mode}" } });
  // Saved on blur, not on every keystroke.
  expect(mock.settings.has("naming_template")).toBe(false);
  fireEvent.blur(naming);

  await waitFor(() => {
    expect(mock.settings.get("capture_delay")).toEqual({ value: 5 });
    expect(mock.settings.get("include_cursor")).toEqual({ value: true });
    expect(mock.settings.get("naming_template")).toEqual({ value: "{date}_{mode}" });
  });
});

test("capture: an unset delay shows None, Rust's real default (D10)", async () => {
  setup();
  const none = await screen.findByRole("button", { name: "None" });
  expect(none.getAttribute("aria-pressed")).toBe("true");
});

test("shortcuts: a recorded combo is stored and re-registered", async () => {
  const { mock } = setup();
  fireEvent.click(await screen.findByRole("button", { name: "Region Capture: CmdOrCtrl+Shift+S" }));
  fireEvent.keyDown(window, { key: "r", metaKey: true, shiftKey: true });
  fireEvent.keyUp(window, { key: "r" });

  await waitFor(() =>
    expect(mock.settings.get("hotkey_region")).toEqual({ value: "CmdOrCtrl+Shift+R" }),
  );
  await waitFor(() => expect(called(mock, "apply_shortcuts")).toHaveLength(1));
  expect(
    await screen.findByRole("button", { name: "Region Capture: CmdOrCtrl+Shift+R" }),
  ).toBeTruthy();
});

test("shortcuts: a rejected combo keeps the attempt visible with Rust's error", async () => {
  setup({
    commands: {
      apply_shortcuts: () => {
        throw "could not register 'CmdOrCtrl+Q': already taken";
      },
    },
  });
  fireEvent.click(
    await screen.findByRole("button", { name: "Full Screen Capture: CmdOrCtrl+Shift+A" }),
  );
  fireEvent.keyDown(window, { key: "q", metaKey: true });
  fireEvent.keyUp(window, { key: "q" });

  expect(await screen.findByText("could not register 'CmdOrCtrl+Q': already taken")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Full Screen Capture: CmdOrCtrl+Q" })).toBeTruthy();
});

test("shortcuts: reset restores the default", async () => {
  const { mock } = setup({ settings: { hotkey_window: { value: "CmdOrCtrl+Alt+W" } } });
  fireEvent.click(await screen.findByRole("button", { name: "Reset Window Capture to default" }));
  await waitFor(() =>
    expect(mock.settings.get("hotkey_window")).toEqual({ value: "CmdOrCtrl+Shift+W" }),
  );
});

test("history: cancelling the confirmation keeps the OCR index on", async () => {
  const { mock, answerNextDialog } = setup();
  answerNextDialog("Cancel");
  const toggle = await screen.findByRole("switch", { name: "截图文字索引" });
  fireEvent.click(toggle);

  await waitFor(() => expect(called(mock, "plugin:dialog|message")).toHaveLength(1));
  expect(called(mock, "clear_ocr_index")).toHaveLength(0);
  expect(mock.settings.has("ocr_index_enabled")).toBe(false);
  expect(toggle.getAttribute("aria-checked")).toBe("true");
});

test("history: confirming clears the index, then turns it off", async () => {
  const { mock, answerNextDialog } = setup();
  answerNextDialog("Ok");
  fireEvent.click(await screen.findByRole("switch", { name: "截图文字索引" }));

  await waitFor(() => expect(mock.settings.get("ocr_index_enabled")).toEqual({ value: false }));
  expect(called(mock, "clear_ocr_index")).toHaveLength(1);
  const order = mock.calls.map(([cmd, args]) =>
    cmd === "plugin:store|set" ? `set:${(args as { key: string }).key}` : cmd,
  );
  expect(order.indexOf("clear_ocr_index")).toBeLessThan(order.indexOf("set:ocr_index_enabled"));
});

test("history: clearing history moves every capture to the Trash after confirming", async () => {
  const items = ["/shots/images/a.png", "/shots/images/b.png"].map((full_path) => ({ full_path }));
  const { mock, answerNextDialog } = setup({
    commands: { list_history_items: () => items as never },
  });
  answerNextDialog("Ok");
  fireEvent.click(await screen.findByRole("button", { name: "移到废纸篓" }));

  await waitFor(() =>
    expect(called(mock, "delete_history_items")).toEqual([
      ["delete_history_items", { paths: ["/shots/images/a.png", "/shots/images/b.png"] }],
    ]),
  );
});

test("diagnostics: running the check lists permissions and capabilities", async () => {
  setup();
  fireEvent.click(await screen.findByRole("button", { name: "运行检查" }));
  const list = await screen.findByRole("list");
  expect(within(list).getByText("screenRecording")).toBeTruthy();
  expect(within(list).getByText("可用")).toBeTruthy();
  expect(within(list).getByText("需要处理")).toBeTruthy();
  expect(screen.getByText("DDU 0.1.9 · macos 26.0 · aarch64")).toBeTruthy();
});

test("diagnostics: a failed check shows the error", async () => {
  setup({
    commands: {
      get_diagnostics_bundle: () => {
        throw "boom";
      },
    },
  });
  fireEvent.click(await screen.findByRole("button", { name: "运行检查" }));
  expect(await screen.findByText("无法读取本机诊断信息。")).toBeTruthy();
});

test("shortcuts: only the last row clicked records", async () => {
  const { mock } = setup();
  fireEvent.click(await screen.findByRole("button", { name: "Region Capture: CmdOrCtrl+Shift+S" }));
  fireEvent.click(screen.getByRole("button", { name: "Window Capture: CmdOrCtrl+Shift+W" }));
  fireEvent.keyDown(window, { key: "k", metaKey: true });
  fireEvent.keyUp(window, { key: "k" });

  await waitFor(() => expect(mock.settings.get("hotkey_window")).toEqual({ value: "CmdOrCtrl+K" }));
  expect(mock.settings.has("hotkey_region")).toBe(false);
  await waitFor(() => expect(called(mock, "apply_shortcuts")).toHaveLength(1));
});

test("shortcuts: releasing only modifiers does not commit", async () => {
  const { mock } = setup();
  fireEvent.click(await screen.findByRole("button", { name: "Region Capture: CmdOrCtrl+Shift+S" }));
  fireEvent.keyDown(window, { key: "Meta", metaKey: true });
  fireEvent.keyUp(window, { key: "Meta" });
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(mock.settings.has("hotkey_region")).toBe(false);
  expect(screen.getByRole("button", { name: "Region Capture: recording" })).toBeTruthy();
});

test("shortcuts: a later successful apply clears the error", async () => {
  let reject = true;
  setup({
    commands: {
      apply_shortcuts: () => {
        if (reject) throw "taken";
      },
    },
  });
  fireEvent.click(await screen.findByRole("button", { name: "Region Capture: CmdOrCtrl+Shift+S" }));
  fireEvent.keyDown(window, { key: "q", metaKey: true });
  fireEvent.keyUp(window, { key: "q" });
  expect(await screen.findByText("taken")).toBeTruthy();

  reject = false;
  fireEvent.click(screen.getByRole("button", { name: "Reset Region Capture to default" }));
  await waitFor(() => expect(screen.queryByText("taken")).toBeNull());
});

test("history: retention and cleanup are written", async () => {
  const { mock } = setup();
  fireEvent.click(await screen.findByRole("switch", { name: /自动清理过期截图/ }));
  fireEvent.click(screen.getByRole("combobox", { name: "保留期限" }));
  const option = await screen.findByRole("option", { name: "90 days" });
  // Base UI commits a selection on the pointer-up of a full click sequence.
  fireEvent.pointerDown(option);
  fireEvent.mouseDown(option);
  fireEvent.pointerUp(option);
  fireEvent.mouseUp(option);
  fireEvent.click(option);
  await waitFor(() => {
    expect(mock.settings.get("history_cleanup_enabled")).toEqual({ value: true });
    expect(mock.settings.get("history_retention_days")).toEqual({ value: 90 });
  });
});

test("history: re-enabling the OCR index writes true without asking", async () => {
  const { mock } = setup({ settings: { ocr_index_enabled: { value: false } } });
  fireEvent.click(await screen.findByRole("switch", { name: /截图文字索引/ }));
  await waitFor(() => expect(mock.settings.get("ocr_index_enabled")).toEqual({ value: true }));
  expect(called(mock, "plugin:dialog|message")).toHaveLength(0);
});

test("history: cancelling clear-history touches nothing", async () => {
  const { mock, answerNextDialog } = setup();
  answerNextDialog("Cancel");
  fireEvent.click(await screen.findByRole("button", { name: "移到废纸篓" }));
  await waitFor(() => expect(called(mock, "plugin:dialog|message")).toHaveLength(1));
  expect(called(mock, "list_history_items")).toHaveLength(0);
  expect(called(mock, "delete_history_items")).toHaveLength(0);
});

test("general: an autostart failure stays inside its section", async () => {
  setup({
    plugins: {
      "plugin:autostart|is_enabled": () => {
        throw "plugin unavailable";
      },
    },
  });
  expect(await screen.findByText(/无法读取开机启动状态/)).toBeTruthy();
  expect(screen.queryByRole("switch", { name: "开机自动启动" })).toBeNull();
  expect(screen.getByRole("switch", { name: "Include Cursor" })).toBeTruthy();
});

test("storage: cancelling the picker keeps the path; a picker error is shown", async () => {
  let fail = false;
  const { mock } = setup({
    settings: { screenshot_path: { value: "/Users/me/Desktop" } },
    plugins: {
      "plugin:dialog|open": () => {
        if (fail) throw "dialog unavailable";
        return null;
      },
    },
  });
  fireEvent.click(await screen.findByRole("button", { name: "选择目录" }));
  await waitFor(() => expect(called(mock, "plugin:dialog|open")).toHaveLength(1));
  expect(mock.settings.get("screenshot_path")).toEqual({ value: "/Users/me/Desktop" });

  fail = true;
  fireEvent.click(await screen.findByRole("button", { name: "选择目录" }));
  expect(await screen.findByText(/选择目录失败/)).toBeTruthy();
});

test("capture: the naming field follows changes from elsewhere and shows the default for empty", async () => {
  const { mock } = setup({ settings: { naming_template: { value: "" } } });
  const naming = await screen.findByRole("textbox", { name: "File Naming" });
  expect((naming as HTMLInputElement).value).toBe("{date}_{time}_{mode}");

  await act(() => mock.externalWrite("naming_template", { value: "{mode}" }));
  await waitFor(() => expect((naming as HTMLInputElement).value).toBe("{mode}"));
});
