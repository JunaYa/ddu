import { expect, test } from "vite-plus/test";
import { createQueryClient } from "../src/query-client.ts";

test("createQueryClient returns an independent client per call", () => {
  expect(createQueryClient()).not.toBe(createQueryClient());
});

test("createQueryClient applies the shared query defaults", () => {
  const queries = createQueryClient().getDefaultOptions().queries;
  expect(queries?.staleTime).toBe(5 * 60 * 1000);
  expect(queries?.retry).toBe(2);
});
