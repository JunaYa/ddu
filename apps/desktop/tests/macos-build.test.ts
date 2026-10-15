// @vitest-environment node
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, expect, test } from "vite-plus/test";

const fixtures: string[] = [];
afterEach(() =>
  fixtures.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true })),
);

// Execute the real shell scripts, substituting only external build tools.
// No certificates, downloads, or native compiler are needed for these checks.
function fixture(extra: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), "ddu-macos-build-"));
  fixtures.push(root);
  const app = join(root, "apps/desktop");
  const bin = join(root, "bin");
  mkdirSync(bin, { recursive: true });
  mkdirSync(join(app, "src-tauri"), { recursive: true });
  cpSync(resolve(import.meta.dirname, "../scripts"), join(app, "scripts"), { recursive: true });
  for (const name of ["cargo", "rustc", "rustup", "uname", "lipo", "tauri"]) {
    writeFileSync(
      join(bin, name),
      `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const name = path.basename(process.argv[1]);
const args = process.argv.slice(2);
fs.appendFileSync(process.env.BUILD_LOG, JSON.stringify({name, args, signing: process.env.APPLE_SIGNING_IDENTITY, notarize: !!process.env.APPLE_PASSWORD}) + '\\n');
if (name === 'uname') console.log('Darwin');
if (name === 'rustc') console.log('host: ' + (process.env.TEST_HOST || 'aarch64-apple-darwin'));
if (name === 'rustup') console.log(process.env.TEST_TARGETS || 'aarch64-apple-darwin\\nx86_64-apple-darwin');
if (name === 'cargo') {
  const target = args[args.indexOf('--target') + 1];
  const dir = args[args.indexOf('--target-dir') + 1];
  const out = path.join(dir, target, 'release/deps');
  fs.mkdirSync(out, {recursive: true});
  fs.writeFileSync(path.join(out, 'libpdfium.dylib'), process.env.TEST_LIBRARY_ARCH || (target.startsWith('aarch64') ? 'arm64' : 'x86_64'));
}
if (name === 'lipo') console.log(fs.readFileSync(args[1], 'utf8'));
`,
      { mode: 0o755 },
    );
  }
  const env = {
    PATH: `${bin}:${process.env.PATH}`,
    BUILD_LOG: join(root, "calls.jsonl"),
    APPLE_SIGNING_IDENTITY: "Apple Development: Test",
    ...extra,
  };
  return {
    app,
    run: (mode: string, arch?: string) =>
      spawnSync("sh", [join(app, "scripts/build-macos.sh"), mode, ...(arch ? [arch] : [])], {
        env,
        encoding: "utf8",
      }),
    calls: () =>
      readFileSync(env.BUILD_LOG, "utf8")
        .trim()
        .split("\n")
        .map(
          (line) =>
            JSON.parse(line) as {
              name: string;
              args: string[];
              signing?: string;
              notarize: boolean;
            },
        ),
  };
}

test.each([
  ["arm64", "aarch64-apple-darwin", "arm64"],
  ["x64", "x86_64-apple-darwin", "x86_64"],
])("%s builds the application and PDFium for the same target", (arch, target, dylibArch) => {
  const build = fixture();
  const result = build.run("signed", arch);
  expect(result.stderr).toBe("");
  expect(result.status).toBe(0);
  expect(build.calls().find((call) => call.name === "cargo")?.args).toContain(target);
  expect(build.calls().find((call) => call.name === "tauri")?.args).toEqual([
    "build",
    "--target",
    target,
    "--bundles",
    "app",
    "--config",
    `src-tauri/tauri.bundle.${arch}.json`,
  ]);
  expect(
    readFileSync(join(build.app, `src-tauri/frameworks/${target}/libpdfium.dylib`), "utf8"),
  ).toBe(dylibArch);
});

test("defaults to the host architecture and honors a custom target directory", () => {
  const build = fixture({ TEST_HOST: "x86_64-apple-darwin", CARGO_TARGET_DIR: "custom target" });
  expect(build.run("signed").status).toBe(0);
  expect(build.calls().find((call) => call.name === "cargo")?.args).toContain(
    join(build.app, "custom target"),
  );
  expect(build.calls().find((call) => call.name === "tauri")?.args).toContain(
    "x86_64-apple-darwin",
  );
});

test("rejects a PDFium architecture mismatch before bundling", () => {
  const build = fixture({ TEST_LIBRARY_ARCH: "arm64" });
  const result = build.run("signed", "x64");
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("PDFium architecture mismatch");
  expect(build.calls().some((call) => call.name === "tauri")).toBe(false);
});

test("rejects missing Rust targets with an install command", () => {
  const build = fixture({ TEST_TARGETS: "aarch64-apple-darwin" });
  expect(build.run("signed", "x64").stderr).toContain("rustup target add x86_64-apple-darwin");
  expect(build.calls().some((call) => call.name === "cargo")).toBe(false);
});

test("signed builds reject ad-hoc identities; explicit ad-hoc builds skip notarization", () => {
  const denied = fixture({ APPLE_SIGNING_IDENTITY: "-" });
  expect(denied.run("signed", "arm64").status).not.toBe(0);
  const build = fixture({ APPLE_PASSWORD: "test-only", APPLE_ID: "test-only" });
  expect(build.run("adhoc", "arm64").status).toBe(0);
  expect(build.calls().find((call) => call.name === "tauri")).toMatchObject({
    signing: "-",
    notarize: false,
  });
});

test("DMGs require release credentials and pass the password under Tauri's variable name", () => {
  const denied = fixture();
  expect(denied.run("dmg", "arm64").status).not.toBe(0);
  const build = fixture({
    APPLE_SIGNING_IDENTITY: "Developer ID Application: Test",
    APPLE_ID: "test",
    APPLE_TEAM_ID: "test",
    APPLE_APP_PASSWORD: "test-only",
  });
  expect(build.run("dmg", "x64").status).toBe(0);
  const call = build.calls().find((entry) => entry.name === "tauri");
  expect(call?.args).toContain("dmg");
  expect(call?.notarize).toBe(true);
});

test("unsupported targets fail before invoking build tools", () => {
  const build = fixture();
  const result = build.run("signed", "universal-apple-darwin");
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("Unsupported macOS target");
});
