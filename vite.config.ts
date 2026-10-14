import { defineConfig } from "vite-plus";

const DEEP_IMPORTS = ["@ddu/*/src/*", "@ddu/*/src/**"];

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
      "no-restricted-imports": ["error", { patterns: DEEP_IMPORTS }],
      // `_`-prefixed names are intentionally unused (e.g. required callback params).
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
    },
    // Overrides replace a rule's options, so each repeats the deep-import ban.
    overrides: [
      {
        // React windows reach Tauri only through @ddu/native (W2/N5).
        files: ["apps/desktop/src/windows/**", "apps/desktop/src/shared/**"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                ...DEEP_IMPORTS,
                {
                  group: ["@tauri-apps/*", "@tauri-apps/**"],
                  message: "Use @ddu/native (specs/11).",
                },
              ],
            },
          ],
        },
      },
      {
        // @ddu/native is framework-agnostic: no React, no UI, no data hooks (N1).
        files: ["packages/native/**"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                ...DEEP_IMPORTS,
                {
                  group: [
                    "react",
                    "react-dom",
                    "react/*",
                    "react-dom/*",
                    "@ddu/hooks",
                    "@ddu/hooks/*",
                    "@ddu/ui",
                    "@ddu/ui/*",
                  ],
                  message: "@ddu/native must not depend on React or the UI (specs/11 N1).",
                },
              ],
            },
          ],
        },
      },
      {
        // Only @ddu/native talks to Tauri; hooks and utils go through it (specs/10 § 3).
        files: ["packages/hooks/src/**", "packages/utils/**"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                ...DEEP_IMPORTS,
                {
                  group: ["@tauri-apps/*", "@tauri-apps/**"],
                  message: "Use @ddu/native (specs/11).",
                },
              ],
            },
          ],
        },
      },
      {
        // The design system takes data as props (specs/10 § 3).
        files: ["packages/ui/**"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                ...DEEP_IMPORTS,
                {
                  group: [
                    "@tauri-apps/*",
                    "@tauri-apps/**",
                    "@ddu/native",
                    "@ddu/native/*",
                    "@ddu/hooks",
                    "@ddu/hooks/*",
                  ],
                  message: "@ddu/ui is presentational; pass data in as props.",
                },
              ],
            },
          ],
        },
      },
    ],
  },
  run: {
    // Wrapper scripts, servers and native builds must execute on every request.
    // Pure checks/tests/frontend builds opt into caching in their callers.
    cache: { scripts: false, tasks: true },
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
