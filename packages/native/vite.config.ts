import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    // Tauri's IPC mocks install themselves on `window`.
    environment: "jsdom",
    // Vitest v4 compatibility: preserve mock call history.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    clearMocks: false,
  },
});
