import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
  },
  pack: {
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
    },
    dts: { generator: "tsgo" },
    // devExports: top-level `exports` point at src (so workspace consumers
    // resolve TS source in dev — no build-order dependency / cross-package
    // HMR), while the dist mapping is written to publishConfig for publish.
    exports: { devExports: true },
  },
  run: {
    tasks: {
      // Declared as a config task (not a package.json script) so the task
      // runner archives `dist/` on success and restores it on a cache hit.
      // This is the artifact-restoration capability that affected-only CI
      // depends on (R5/R6); proven here on the base package.
      build: { command: "vp pack", cache: { output: ["dist/**"] } },
    },
  },
});
