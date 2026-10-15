import { describe, expect, it } from "vite-plus/test";
import { shouldAutoHidePreview } from "./preview-lifecycle.ts";

describe("shouldAutoHidePreview", () => {
  it("waits while the user is hovering or editing", () => {
    expect(shouldAutoHidePreview({ hovered: true, editing: false })).toBe(false);
    expect(shouldAutoHidePreview({ hovered: false, editing: true })).toBe(false);
  });

  it("waits while a preview action is running", () => {
    expect(shouldAutoHidePreview({ hovered: false, editing: false, busy: true })).toBe(false);
  });

  it("hides an untouched preview after its timeout", () => {
    expect(shouldAutoHidePreview({ hovered: false, editing: false })).toBe(true);
  });
});
