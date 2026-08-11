# DDU Screenshot

DDU is a lightweight, local-first screenshot utility for macOS. It captures a full screen, a smart region, or a window; copies the result to the clipboard; then offers a short-lived preview for annotation and saving an edited copy.

## What it does

- Capture full screen, region, and window with configurable global shortcuts.
- Copy each capture to the clipboard automatically, with a retry in the preview.
- Add annotations, text, steps, pixelation, and blur without overwriting the original.
- Keep local capture history. User-initiated deletion moves captures to macOS Trash.
- Offer optional history cleanup, local diagnostics, and an opt-in launch-at-login setting.

DDU does not require an account and does not upload screenshots, diagnostics, or telemetry. OCR, recording, GIF conversion, cloud sync, and workflow automation are not release features.

## Platform support

macOS is the supported release platform. Linux support is experimental.

## Development

```sh
pnpm install
pnpm test
pnpm dev:desktop
```

## macOS release

A direct-download DMG must be Developer ID signed, notarized, and stapled. Run `pnpm release:check-macos` before starting a release build; it fails fast when required signing/notarization inputs are missing. See [the release checklist](docs/release-macos.md).
