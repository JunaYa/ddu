import { afterEach, expect, test } from "vite-plus/test";
import { call, NativeError } from "../src/index.ts";
import { mockNative, resetNativeMock } from "../src/testing.ts";

afterEach(resetNativeMock);

test("call forwards arguments and returns the command result", async () => {
  const mock = mockNative({ commands: { delete_history_items: ({ paths }) => paths.length } });
  await expect(call("delete_history_items", { paths: ["/a.png", "/b.png"] })).resolves.toBe(2);
  expect(mock.calls).toContainEqual(["delete_history_items", { paths: ["/a.png", "/b.png"] }]);
});

test("call wraps a rejected command in NativeError with the Rust message", async () => {
  mockNative({
    commands: {
      apply_shortcuts: () => {
        throw "could not register 'CmdOrCtrl+Q': taken";
      },
    },
  });
  const error = await call("apply_shortcuts").catch((e: unknown) => e);
  expect(error).toBeInstanceOf(NativeError);
  expect(error).toMatchObject({
    command: "apply_shortcuts",
    message: "could not register 'CmdOrCtrl+Q': taken",
  });
});
