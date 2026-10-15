import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

const host = process.env.TAURI_DEV_HOST;

/** One HTML entry per Tauri window; the label is the file name (specs/12 § 2). */
const windows = ["main", "setting", "preview", "startup", "capture", "permission"] as const;

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
});
