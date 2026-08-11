# macOS release checklist

DDU distributes a direct-download DMG. Do not publish an unsigned or un-notarized artifact.

## Before building

- Use a macOS machine with Xcode command-line tools.
- Supply these environment variables through the release secret store, never a checked-in file: `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_TEAM_ID`, and `APPLE_APP_PASSWORD`.
- Run `pnpm release:check-macos`; it must pass before a release build.
- Run `pnpm test`.

## Build and notarize

- Build the DMG with `pnpm build:dmg` using the Developer ID identity.
- Submit the produced DMG with `xcrun notarytool submit --wait` using the release credentials.
- Staple the accepted ticket with `xcrun stapler staple <DDU.dmg>`.
- Verify with `codesign --verify --deep --strict <DDU.app>`, `spctl -a -vv <DDU.app>`, and `xcrun stapler validate <DDU.dmg>`.

## Fresh-machine smoke test

- Install the stapled DMG on a macOS account without DDU preferences.
- Grant Screen Recording only when capture is attempted; leave Accessibility ungranted, then verify region capture has its designed fallback.
- Verify full-screen, smart-region, and window capture; each must copy to the clipboard and show a preview.
- Save an edited image and confirm the original is still in history.
- Delete a history item and restore it from Trash.
- Open Settings and run local diagnostics; confirm no data leaves the device.

Record the result and retain notarization logs with the release artifacts, outside this repository.
