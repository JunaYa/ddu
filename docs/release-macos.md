# macOS release checklist

DDU distributes a direct-download DMG. Do not publish an unsigned or un-notarized artifact.

## Before building

- Use a macOS machine with Xcode command-line tools.
- Supply these environment variables through the release secret store, never a checked-in file: `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_TEAM_ID`, and `APPLE_APP_PASSWORD`.
- Run `vp run desktop#release:check-macos`; it must pass before a release build.
- Run `vp run ready`.

## Build and notarize

- Install both Rust targets: `rustup target add aarch64-apple-darwin x86_64-apple-darwin`.
- Build separate DMGs with `pnpm run build:dmg:arm64` and `pnpm run build:dmg:x64` using the Developer ID identity. The default `build:dmg` builds the Rust toolchain's host architecture.
- Find each DMG under `apps/desktop/src-tauri/target/<target>/release/bundle/dmg/`; Tauri includes the architecture in its filename. The `.app` is under the same target's `bundle/macos/` directory.
- Verify both the app executable and `Contents/Frameworks/libpdfium.dylib` with `lipo -archs`: the Apple Silicon package must report `arm64`, and the Intel package `x86_64`.
- Submit the produced DMG with `xcrun notarytool submit --wait` using the release credentials.
- Staple the accepted ticket with `xcrun stapler staple <DDU.dmg>`.
- Verify with `codesign --verify --deep --strict <DDU.app>`, `spctl -a -vv <DDU.app>`, and `xcrun stapler validate <DDU.dmg>`.

## Fresh-machine smoke test

- Run this checklist on both Apple Silicon and Intel hardware, including opening a local image and recognizing its text.
- Install the stapled DMG on a macOS account without DDU preferences.
- Grant Screen Recording only when capture is attempted; leave Accessibility ungranted, then verify region capture has its designed fallback.
- Verify full-screen, smart-region, and window capture; each must copy to the clipboard and show a preview.
- Save an edited image and confirm the original is still in history.
- Delete a history item and restore it from Trash.
- Open Settings and run local diagnostics; confirm no data leaves the device.

Record the result and retain notarization logs with the release artifacts, outside this repository.

## GitHub Actions

CI and publishing use `macos-15` (Apple Silicon) and `macos-15-intel` (Intel). Each release job stages its own target's PDFium and passes the matching bundle configuration to Tauri. See [GitHub runner architectures](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).

Configure `APPLE_CERTIFICATE` (base64-encoded P12), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_TEAM_ID`, and `APPLE_APP_PASSWORD` as repository secrets. Publishing maps `APPLE_APP_PASSWORD` to `APPLE_PASSWORD`, as required by [Tauri's signing and notarization flow](https://v2.tauri.app/distribute/sign/macos/). Release preflight refuses absent credentials or an ad-hoc/development identity.
