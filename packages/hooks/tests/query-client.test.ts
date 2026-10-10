import { expect, test } from "vite-plus/test";
import { createQueryClient } from "../src/index.ts";

test("createQueryClient returns an independent client per call", () => {
  expect(createQueryClient()).not.toBe(createQueryClient());
});

test("createQueryClient does not refetch when a window regains focus", () => {
  const queries = createQueryClient().getDefaultOptions().queries;
  expect(queries?.refetchOnWindowFocus).toBe(false);
  expect(queries?.retry).toBe(2);
});
