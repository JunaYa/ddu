import type { ChainNode } from "@ddu/native";
import { expect, test } from "vite-plus/test";
import {
  dragSelection,
  hudLabel,
  hudPosition,
  nextChainIndex,
  toGlobal,
  toLocal,
  veilPath,
  wheelChainIndex,
} from "../src/windows/capture/geometry.ts";

const monitor = { x: -246, y: -1080, w: 1920, h: 1080 };
const node = (x: number, role = "AXButton"): ChainNode => ({
  rect: { x, y: 0, w: 10, h: 10 },
  role,
  label: "",
});

test("local and global coordinates round-trip on a negative-origin display", () => {
  const global = { x: -100, y: -500, w: 40, h: 30 };
  const local = toLocal(global, monitor);
  expect(local).toEqual({ x: 146, y: 580, w: 40, h: 30 });
  expect(toGlobal(local, monitor)).toEqual(global);
});

test("a drag starts only past the threshold, then follows the pointer either way", () => {
  expect(dragSelection({ x: 10, y: 10 }, { x: 13, y: 12 }, false)).toBeNull();
  expect(dragSelection({ x: 10, y: 10 }, { x: 20, y: 30 }, false)).toEqual({
    x: 10,
    y: 10,
    w: 10,
    h: 20,
  });
  expect(dragSelection({ x: 10, y: 10 }, { x: 8, y: 9 }, true)).toEqual({ x: 8, y: 9, w: 2, h: 1 });
});

test("the veil cuts a hole over the highlight", () => {
  expect(veilPath({ width: 100, height: 50 }, null)).toBe("M0,0 H100 V50 H0 Z");
  expect(veilPath({ width: 100, height: 50 }, { x: 1, y: 2, w: 3, h: 4 })).toBe(
    "M0,0 H100 V50 H0 Z M1,2 h3 v4 h-3 Z",
  );
});

test("the badge sits below the highlight, flips above near the bottom, and stays on screen", () => {
  const viewport = { width: 1000, height: 600 };
  expect(hudPosition({ x: 100, y: 100, w: 50, h: 50 }, viewport)).toEqual({ top: 158, left: 100 });
  expect(hudPosition({ x: 100, y: 500, w: 50, h: 80 }, viewport)).toEqual({ top: 466, left: 100 });
  expect(hudPosition({ x: 990, y: 0, w: 5, h: 5 }, viewport).left).toBe(760);
});

test("the badge shows size, app and role, or only size while dragging", () => {
  const rect = { x: 0, y: 0, w: 120.4, h: 79.6 };
  expect(hudLabel(rect, false, "Safari", "AXButton")).toBe("120 × 80 · Safari · AXButton");
  expect(hudLabel(rect, true, "Safari", "AXButton")).toBe("120 × 80");
});

test("a new element resets the level by mode; the same element keeps it", () => {
  const chain = [node(0), node(0, "AXGroup"), node(0, "AXWindow")];
  expect(nextChainIndex([], chain, 1, "auto")).toBe(0);
  expect(nextChainIndex([], chain, 0, "window")).toBe(2);
  expect(nextChainIndex(chain, chain, 1, "auto")).toBe(1);
  expect(nextChainIndex(chain, chain.slice(0, 1), 2, "auto")).toBe(0);
});

test("wheel up widens to the parent, wheel down narrows, within bounds", () => {
  expect(wheelChainIndex(0, -1, 3)).toBe(1);
  expect(wheelChainIndex(2, -1, 3)).toBe(2);
  expect(wheelChainIndex(1, 1, 3)).toBe(0);
  expect(wheelChainIndex(0, 1, 3)).toBe(0);
});
