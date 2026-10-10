import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    // Legacy Vue code is frozen until it is deleted (specs/12 § 4); reformatting
    // it would only add churn to the window-by-window migration diffs.
    ignorePatterns: ["apps/desktop/src/legacy/**", "**/src-tauri/**", ".agents/**", ".claude/**"],
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
    // Template default rule set (correctness); stricter categories would flag
    // the unmodified design-system packages copied from the template (D2).
    // Legacy Vue windows are type-checked by vue-tsc (`desktop#check:legacy`)
    // and are not linted; they only shrink until Phase 8 deletes them.
    ignorePatterns: ["apps/desktop/src/legacy/**", "**/src-tauri/**", "**/dist/**"],
    rules: {
      // Packages are consumed only through their `exports` entries; deep imports
      // into a package's src bypass that boundary (specs/10 § 3).
      "no-restricted-imports": ["error", { patterns: ["@ddu/*/src/*", "@ddu/*/src/**"] }],
      // `_`-prefixed names are intentionally unused (e.g. required callback params).
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
    },
  },
  run: {
    cache: true,
    tasks: {
      // The license gate evaluation is time-sensitive (exemption expiry checks
      // the clock, which is NOT a cache input). Caching it would let an expired
      // exemption replay green — so this task must never be cached.
      "license:check": {
        command:
          "node tools/license-gate/src/index.ts .licenses.json tools/license-gate/license-exceptions.json",
        cache: false,
      },
    },
  },
});
