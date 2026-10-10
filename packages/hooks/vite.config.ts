import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
    },
    dts: { generator: "tsgo" },
    // devExports entry-only (R19); react / react-dom / @tanstack/react-query
    // are peers (catalog single-instance) and externalized from the bundle.
    exports: { devExports: true },
  },
  // Hooks render components/hooks in tests, which need a DOM. Other packages
  // stay on the default node environment — test env is set per-package.
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    environment: "jsdom",
  },
});
