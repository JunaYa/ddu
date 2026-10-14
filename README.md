# DDU

**A local-first macOS screenshot tool for capturing, annotating, extracting text, and finding screenshots again.**

English · [简体中文](README_cn.md)

DDU runs in the menu bar. Capture the display under your cursor, select a window or interface element, or draw a region; then copy the image, annotate it, or extract its text. Screenshots and the searchable OCR index stay on your machine, without an account.

This README describes the current source tree. Older packaged releases may have fewer features. macOS is the supported native development and release platform; Linux and Windows adapters in the repository are not a promise of working desktop builds.

## Features

| Area            | Available in the current app                                                                                                                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Capture         | Full-screen, smart region, and window capture; configurable global shortcuts; capture on the cursor’s display.                                                                                                  |
| Smart selection | Frozen-screen overlay, hover selection, scroll through element hierarchy, manual drag selection, Enter to confirm a highlighted target, and Escape to cancel. Element-level selection uses macOS Accessibility. |
| Preview         | Automatic image copy, copy retry, open editor, copy recognized text, and dismiss. Idle previews hide automatically; closing windows keeps the menu-bar app running.                                             |
| Annotation      | Arrows, lines, rectangles, ellipses, freehand drawing, highlighting, text, numbered steps, blur, pixelation, undo/redo, and saving an edited copy without overwriting the original.                             |
| Local OCR       | PP-OCRv6 through LiteParse, with a macOS Vision fallback. Recognize an image or selected area, copy individual lines or all text, and optionally merge line breaks.                                             |
| History         | Grid/list views, chronological sorting, image preview and file information, batch deletion to Trash, and horizontal/vertical image composition.                                                                 |
| Text search     | Search recognized screenshot text; batch-index selected history items. The local index can be disabled and cleared in Settings.                                                                                 |
| Settings        | Save directory, capture preferences, shortcut configuration, optional launch at login, retention policy, permission status, and local diagnostics.                                                              |

Scrolling capture, cloud sync/upload, and AI services are not available product features. Recording, GIF conversion, and workflow commands exist in the backend, but are not complete user-facing release workflows. The file-naming template is stored by Settings but is not yet applied by the capture backend.

Settings → **Permissions** shows Accessibility, Screen Recording, and Microphone access. Click Authorize or Manage to open System Settings and a floating guide. For Accessibility and Screen Recording, drag the running DDU.app from the guide into the system list and enable its switch. Microphone access uses the system consent prompt; it cannot be granted by dragging. The guide refreshes status and offers a restart for Screen Recording. Dragging requires a bundled app; development binaries show manual guidance.

## Using DDU

1. Launch the app and use its menu-bar icon to open history, settings, or capture actions.
2. Grant **Screen Recording** when prompted. Grant **Accessibility** if you want selection of individual interface elements; window/manual-region selection provides the fallback when it is unavailable.
3. Capture with a shortcut or the menu. Every capture is saved and copied to the clipboard. Use the preview’s **Text** tool to recognize and copy text from any capture.
4. Hover over the preview for **Edit**, **Copy**, **Text**, or **Close**. In the editor, save an edited copy or copy the annotated image.
5. Open history to revisit screenshots. For text search, first recognize the image or select history items and choose **Build text index**.

Closing a window does not quit DDU. Use **Quit** in its menu to exit.

### Default shortcuts on macOS

| Action                              | Shortcut |
| ----------------------------------- | -------- |
| Full screen on the cursor’s display | `⌘ ⇧ A`  |
| Smart region                        | `⌘ ⇧ S`  |
| Window                              | `⌘ ⇧ W`  |

These bindings are configurable in Settings. In smart capture, use the scroll wheel to change the highlighted selection level, drag for a manual region, or press Escape to cancel.

### Storage and privacy

- Screenshots are written to the `images/` subdirectory of the configured save directory. The initial directory is Tauri’s app-local-data directory for `com.ddu.app`; Settings shows the configured location.
- Settings persist locally in `settings.json`. OCR results are stored separately under the app-local-data `ocr-index/` directory, even when screenshots are saved elsewhere.
- DDU does not require a login or upload screenshots for OCR. The OCR engine may download model files on first use; local processing does **not** mean every first-run operation is offline. Native builds also fetch the PDFium dependency.
- Text indexing is enabled by default, but screenshots become searchable only after OCR/indexing runs. Disabling the index clears the saved text index.
- Manual history deletion moves images to macOS Trash. Automatic retention cleanup is **off by default**; if enabled, it permanently deletes expired DDU screenshots. The initial retention setting is 30 days; Settings also offers 7 days, 90 days, and forever.
- Diagnostics expose local version, platform, capability, and permission information; they are not automatically uploaded.

## Development

### Requirements

Use macOS for the native app, with Xcode Command Line Tools and stable Rust/Cargo. Install the [Vite+ CLI (`vp`)](https://www.viteplus.dev/guide) and use the versions declared in the workspace: Node.js 26 and pnpm 12.10.1. The dependency catalog and lockfile pin the frontend toolchain.

Frontend packages and mocked tests can run without macOS; actual capture, permissions, AppKit integration, and native smoke tests need a macOS desktop session.

### Start locally

Run from the repository root:

```sh
vp install                    # dependencies and configured Git hooks
vp run desktop#dev            # Tauri app + frontend development server
```

The root `vp run dev` is an alias for the same desktop task. Tauri starts the frontend server on `http://localhost:1420` and watches Rust changes.

For frontend-only work or component development:

```sh
vp run desktop#dev:frontend
vp run @ddu/ui#storybook       # component explorer on port 6006
```

The app has separate `main.html`, `setting.html`, `startup.html`, `capture.html`, `permission.html`, and `preview.html` entries. Opening them in a regular browser does not provide Tauri IPC or real desktop capabilities; use the native app for end-to-end behavior and the bridge mocks for component tests.

### Check, test, and build

| Command                          | Purpose                                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `vp run ready`                   | Format, lint/type-check, run workspace JS tests, and build frontend/packages. Formatting may modify files. |
| `vp run -r check`                | Run package-level checks, as in CI.                                                                        |
| `vp run -w check`                | Check root workspace configuration.                                                                        |
| `vp run -r test`                 | Run workspace JavaScript/TypeScript tests.                                                                 |
| `vp run desktop#test`            | Run desktop frontend tests.                                                                                |
| `vp run desktop#check:legacy`    | Type-check the remaining Vue code.                                                                         |
| `vp run desktop#build`           | Build frontend assets into `apps/desktop/dist`.                                                            |
| `vp run @ddu/ui#build-storybook` | Build the component documentation.                                                                         |
| `vp run license:gate`            | Check production JS dependency licenses and regenerate third-party notices.                                |

`ready` does **not** run Cargo tests or produce a native app bundle. For native changes, build the frontend first: Tauri resolves its assets during Rust compilation.

```sh
vp run desktop#build
cargo clippy --manifest-path apps/desktop/src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml --lib

# Desktop-session regression: capture teardown, repeated preview close, explicit Quit
cargo run --manifest-path apps/desktop/src-tauri/Cargo.toml --example window_lifecycle_smoke
```

Some native/OCR integration tests are ignored by default because they require desktop permissions or model setup. A passing unit suite does not replace testing real capture, clipboard, multi-display placement, and permission recovery.

### Build a macOS app

```sh
vp run desktop#build:native         # certificate-signed .app
vp run desktop#build:native:adhoc   # local ad-hoc .app
```

The signed build reads `APPLE_SIGNING_IDENTITY` from the environment or root `.env.local` and refuses to run without it. A stable certificate identity helps preserve macOS permission grants across rebuilds. Ad-hoc builds may need Screen Recording permission granted again after rebuilding.

These tasks build frontend assets first, stage `libpdfium.dylib`, and run Tauri with the bundle configuration. Native artifacts are normally under `apps/desktop/src-tauri/target/release/bundle/`. `PDFIUM_LIB_PATH` can override the OCR runtime’s PDFium location when debugging.

For distribution, use a Developer ID identity and follow the [macOS release checklist](docs/release-macos.md):

```sh
vp run desktop#release:check-macos
vp run desktop#build:dmg
```

The preflight checks for `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_TEAM_ID`, and `APPLE_APP_PASSWORD`. It does not prove signing or notarization succeeded: verify the app, notarize and staple the DMG, then test it on a fresh account before publishing. Keep signing credentials outside version control.

## Architecture and repository layout

DDU uses Tauri 2 and Rust for native operations. The UI is migrating to React 19, Tailwind CSS 4, and shared design-system packages. History, settings, startup, and capture windows are React; the preview/editor still uses Vue 3, UnoCSS, and Fabric.js. Both stacks are intentionally supported by the desktop build during migration.

```text
apps/desktop/
  src/windows/       React windows: main, setting, startup, capture, permission
  src/shared/        Window mounting, theme, error boundary
  src/legacy/        Vue preview/editor and its isolated styles
  src-tauri/         Rust commands, capture engine, platform adapters, app lifecycle
  tests/             Frontend behavior and architecture contract tests
  scripts/           Signing preflight, native build, PDFium staging
packages/
  native/            Typed Tauri bridge, settings, events, and test mocks
  hooks/             React state/data hooks over the native bridge
  ui/                Presentational components and Storybook
  tokens/ styles/    Design tokens and shared styling
  iconography/       Icons
  brand/ utils/      Brand assets and shared utilities
tools/              Dependency license gate
specs/              Product specs, migration design, implementation plan
docs/               Research, plans, and release procedures
```

React windows call `@ddu/native`, directly or through `@ddu/hooks`; they do not import Tauri APIs themselves. `@ddu/native` is framework-independent, and `@ddu/ui` receives data through props without depending on the native bridge. Consume packages through their declared exports rather than importing their `src/` internals. These boundaries are enforced in the root lint configuration.

The remaining Vue window is isolated under `src/legacy`. Keep its styles and migration changes separate from React windows; do not remove Vue/UnoCSS or the desktop TypeScript compatibility pin until that window has migrated.

## Troubleshooting

| Symptom                                           | What to check                                                                                                                                                    |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Other apps appear blank or capture is denied      | Check Screen Recording permission for the app you actually launched, then restart DDU. Rebuilt ad-hoc apps may need a new grant.                                 |
| Individual UI elements cannot be selected         | Check Accessibility permission. Manual selection and window-level fallback do not require element access.                                                        |
| Nothing opens after launch                        | DDU is a menu-bar app; use its icon or a capture shortcut. Closing its windows leaves it running.                                                                |
| History text search returns no results            | Recognize the image or batch-index selected items; verify text indexing is enabled. Search is over the OCR index, not every image automatically.                 |
| First OCR request is slow or fails                | Allow time/network access for model initialization; inspect native logs and PDFium availability. macOS Vision is the fallback when the primary OCR engine fails. |
| Native compilation cannot resolve frontend assets | Run `vp run desktop#build` before Cargo commands.                                                                                                                |
| Development server reports port 1420 in use       | Stop the conflicting server; Tauri uses a fixed port.                                                                                                            |

## Contributing and further reading

Keep changes focused and include reproduction steps or tests for behavior changes. For native fixes, test the macOS path as well as mocked frontend behavior. Before proposing a dependency change, run the license gate and review the generated [third-party notices](THIRD_PARTY_NOTICES.txt).

CI has a frontend/workspace lane and a separate macOS lane for affected native work. The frontend lane also checks dependency licenses and high/critical production dependency advisories. Packaging and fresh-machine release checks remain separate responsibilities.

- [Spec index](specs/index.md) — product and architecture documents; specs include future work, not just shipped capabilities.
- [Workspace layout](specs/10-workspace-layout.md), [native bridge](specs/11-native-bridge.md), and [desktop shell](specs/12-desktop-shell.md).
- [Design system](specs/13-design-system.md), [implementation plan](specs/91-impl-plan.md), and [key decisions](specs/99-key-decisions.md).
- [Product outline](docs/outline.md) and [research](docs/research.md).
- [macOS release checklist](docs/release-macos.md).
