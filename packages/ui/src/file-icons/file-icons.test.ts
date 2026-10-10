import { describe, expect, it } from "vite-plus/test";
import { Icons } from "../icons/icons.tsx";
import {
  getFileIcon,
  getFileIconStyle,
  guessMimetypeFromName,
  isCodeMimetype,
} from "./file-icons.tsx";

describe("@ddu/ui file-icons", () => {
  it("classifies guessed Go and Rust mimetypes as code", () => {
    expect(guessMimetypeFromName("main.go")).toBe("text/x-go");
    expect(guessMimetypeFromName("lib.rs")).toBe("text/x-rust");

    expect(isCodeMimetype("text/x-go")).toBe(true);
    expect(isCodeMimetype("text/x-rust")).toBe(true);
    expect(getFileIcon("text/x-go")).toBe(Icons.artifactCode);
    expect(getFileIconStyle("text/x-rust")).toEqual({
      bg: "bg-sky-500/10",
      fg: "text-sky-500",
    });
  });

  it("guesses HEIC/HEIF image mimetypes (so iPhone photos classify as images)", () => {
    expect(guessMimetypeFromName("IMG_7861.HEIC")).toBe("image/heic");
    expect(guessMimetypeFromName("photo.heif")).toBe("image/heif");
  });
});
