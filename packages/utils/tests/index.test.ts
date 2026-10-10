import { expect, test } from "vite-plus/test";
import { diagnosticStatusLabel } from "../src/index.ts";

test("diagnosticStatusLabel marks available capabilities as ready", () => {
  expect(diagnosticStatusLabel("available")).toEqual({ label: "可用", tone: "success" });
});

test("diagnosticStatusLabel makes unavailable or limited capabilities actionable", () => {
  expect(diagnosticStatusLabel("unavailable")).toEqual({ label: "需要处理", tone: "warning" });
  expect(diagnosticStatusLabel("limited")).toEqual({ label: "需要处理", tone: "warning" });
});

test("diagnosticStatusLabel falls back to unknown", () => {
  expect(diagnosticStatusLabel("weird")).toEqual({ label: "未知", tone: "neutral" });
});
