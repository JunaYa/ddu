import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vite-plus/test";
import { WindowShell } from "../src/shared/mount-window.tsx";
import { followSystemTheme } from "../src/shared/system-theme.ts";

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.classList.remove("dark");
});

function fakeMatchMedia(initiallyDark: boolean) {
  let listener: (() => void) | undefined;
  const media = {
    matches: initiallyDark,
    addEventListener: (_: string, cb: () => void) => (listener = cb),
    removeEventListener: () => (listener = undefined),
  };
  vi.stubGlobal("matchMedia", () => media);
  return {
    set(dark: boolean) {
      media.matches = dark;
      listener?.();
    },
    get subscribed() {
      return listener !== undefined;
    },
  };
}

test("followSystemTheme mirrors the system appearance until stopped", () => {
  const system = fakeMatchMedia(true);
  const stop = followSystemTheme();
  expect(document.documentElement.classList.contains("dark")).toBe(true);

  system.set(false);
  expect(document.documentElement.classList.contains("dark")).toBe(false);

  stop();
  expect(system.subscribed).toBe(false);
});

test("a render error shows the window fallback instead of a blank page", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  function Broken(): never {
    throw new Error("boom");
  }
  render(
    <WindowShell>
      <Broken />
    </WindowShell>,
  );
  expect(screen.getByRole("alert").textContent).toContain("窗口出错");
});

test("WindowShell renders its window", () => {
  render(
    <WindowShell>
      <p>设置</p>
    </WindowShell>,
  );
  expect(screen.getByText("设置")).toBeTruthy();
});
