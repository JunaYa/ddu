import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import type { Plugin } from "vite";
import { defineConfig } from "vite-plus";

// Migration period (specs/12 § 4): windows still on Vue live in src/legacy and
// are styled by UnoCSS; migrated windows live in src/windows and use Tailwind
// via @ddu/styles. The Vue plugins, UnoCSS, vue-tsc and the TypeScript 5.9 pin
// in package.json go away with the last Vue window (specs/91 Phase 8, D8).

const host = process.env.TAURI_DEV_HOST;

/** One HTML entry per Tauri window; the label is the file name (specs/12 § 2). */
const windows = ["main", "setting", "preview", "startup", "capture", "permission"] as const;

const isLegacyEntry = (html: string) => html.includes("/src/legacy/");

/** Dev only: load UnoCSS's virtual stylesheet into legacy (Vue) windows. */
function injectUnoDevStyles(): Plugin {
  return {
    name: "ddu:inject-uno-dev-styles",
    apply: "serve",
    transformIndexHtml(html) {
      if (!isLegacyEntry(html)) return;
      return [{ tag: "script", attrs: { type: "module", src: "/__uno.css" }, injectTo: "head" }];
    },
  };
}

export default defineConfig({
  plugins: [
    injectUnoDevStyles(),
    vue(),
    UnoCSS({ mode: "dist-chunk" }),
    react({ exclude: /\.vue$/ }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src/legacy", import.meta.url)),
    },
  },
  // Tauri expects a fixed port and must see Rust errors, so keep the screen.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        windows.map((label) => [label, fileURLToPath(new URL(`./${label}.html`, import.meta.url))]),
      ),
      onwarn(warning, warn) {
        if (warning.code === "INVALID_ANNOTATION" && warning.id?.includes("/node_modules/")) return;
        warn(warning);
      },
    },
  },
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    clearMocks: false,
    environment: "jsdom",
  },
  run: {
    tasks: {
      // Native tasks run their own CLI and are never cached (a replayed
      // `tauri build` would produce no bundle). Ordering lives in the task
      // graph; tauri.conf.json's beforeBuildCommand is empty.
      dev: { command: "tauri dev", cache: false },
      // Signed .app; refuses to build without APPLE_SIGNING_IDENTITY.
      "build:native": {
        command: "sh scripts/build-macos-dev.sh",
        cache: false,
        dependsOn: ["build"],
      },
      // Unsigned .app: Screen Recording grants will not persist across builds.
      "build:native:adhoc": {
        command:
          "sh scripts/stage-pdfium.sh && tauri build --bundles app --config src-tauri/tauri.bundle.conf.json",
        cache: false,
        dependsOn: ["build"],
      },
      "build:dmg": {
        command:
          "sh scripts/stage-pdfium.sh && tauri build --bundles dmg --config src-tauri/tauri.bundle.conf.json",
        cache: false,
        dependsOn: ["build"],
      },
    },
  },
});
