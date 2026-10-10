import { afterEach, expect, test } from "vite-plus/test";
import {
  fileTimes,
  imageDataUrl,
  indexHistoryItems,
  mimeTypeOf,
  openCombinedImage,
  searchHistoryText,
} from "../src/index.ts";
import { mockNative, resetNativeMock } from "../src/testing.ts";

afterEach(resetNativeMock);

test("history commands forward their arguments", async () => {
  const mock = mockNative({
    window: "main",
    commands: {
      search_history_text: ({ query }) => (query === "error" ? ["a.png"] : []),
      ocr_index_items: ({ paths }) => paths.length,
      open_combined_image: () => undefined,
    },
  });
  await expect(searchHistoryText("error")).resolves.toEqual(["a.png"]);
  await expect(indexHistoryItems(["/i/a.png", "/i/b.png"])).resolves.toBe(2);
  await openCombinedImage("AAAA");
  expect(mock.calls).toContainEqual(["open_combined_image", { base64: "AAAA" }]);
});

test("imageDataUrl builds a data URL with the file's MIME type", async () => {
  mockNative({ window: "main", commands: { get_image_base64: () => "QUJD" } });
  await expect(imageDataUrl("/i/shot.JPG")).resolves.toBe("data:image/jpeg;base64,QUJD");
  expect(mimeTypeOf("/i/shot.webp")).toBe("image/webp");
  expect(mimeTypeOf("/i/shot.png")).toBe("image/png");
});

test("fileTimes is all-null when the fs scope refuses the path", async () => {
  mockNative({
    window: "main",
    plugins: {
      "plugin:fs|stat": () => {
        throw "forbidden path";
      },
    },
  });
  await expect(fileTimes("/Users/me/Desktop/images/a.png")).resolves.toEqual({
    modified: null,
    accessed: null,
    created: null,
  });
});
