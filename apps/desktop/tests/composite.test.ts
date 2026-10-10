import { expect, test } from "vite-plus/test";
import { layoutComposite, MAX_COMPOSITE_SIDE } from "../src/windows/main/composite.ts";

const sizes = [
  { width: 100, height: 50 },
  { width: 60, height: 80 },
];

test("vertical stacks top-to-bottom, left-aligned, as wide as the widest", () => {
  expect(layoutComposite(sizes, "vertical")).toEqual({
    width: 100,
    height: 130,
    placements: [
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 0, y: 50, width: 60, height: 80 },
    ],
  });
});

test("horizontal places left-to-right, top-aligned, as tall as the tallest", () => {
  expect(layoutComposite(sizes, "horizontal")).toEqual({
    width: 160,
    height: 80,
    placements: [
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 100, y: 0, width: 60, height: 80 },
    ],
  });
});

test("oversized composites are scaled down to the maximum side", () => {
  const big = layoutComposite(
    [
      { width: 6000, height: 1000 },
      { width: 6000, height: 1000 },
    ],
    "horizontal",
  );
  expect(big.width).toBe(MAX_COMPOSITE_SIDE);
  expect(big.height).toBe(Math.round(1000 * (MAX_COMPOSITE_SIDE / 12000)));
  expect(big.placements[1]?.x).toBeCloseTo(6000 * (MAX_COMPOSITE_SIDE / 12000));
});
