#!/bin/sh
set -eu

app_dir=$(cd "$(dirname "$0")/.." && pwd)
repo_root=$(cd "$app_dir/../.." && pwd)
. "$app_dir/scripts/macos-target.sh"
mode=${1:-signed}
case "$mode" in
  signed|adhoc|dmg) ;;
  *) echo "Usage: build-macos.sh [signed|adhoc|dmg] [arm64|x64]" >&2; exit 1 ;;
esac
target=$(resolve_macos_target "${2-}")
case "$target" in
  aarch64-apple-darwin) architecture=arm64 ;;
  x86_64-apple-darwin) architecture=x64 ;;
esac
if [ "$(uname -s)" != Darwin ]; then
  echo "macOS builds require macOS and Xcode command-line tools." >&2
  exit 1
fi
if ! rustup target list --installed | grep -Fxq "$target"; then
  echo "Missing Rust target. Run: rustup target add $target" >&2
  exit 1
fi
if [ -f "$repo_root/.env.local" ]; then
  . "$repo_root/.env.local"
fi
bundles=app
case "$mode" in
  signed)
    if [ -z "${APPLE_SIGNING_IDENTITY-}" ] || [ "$APPLE_SIGNING_IDENTITY" = - ]; then
      echo "Set APPLE_SIGNING_IDENTITY to a certificate identity; refusing an ad-hoc build." >&2
      echo "Use build:native:adhoc explicitly for temporary local builds." >&2
      exit 1
    fi
    export APPLE_SIGNING_IDENTITY
    ;;
  adhoc)
    export APPLE_SIGNING_IDENTITY=-
    # Ad-hoc builds cannot be notarized, even if release credentials exist.
    unset APPLE_ID APPLE_PASSWORD APPLE_APP_PASSWORD APPLE_TEAM_ID APPLE_API_KEY APPLE_API_ISSUER APPLE_API_KEY_PATH
    ;;
  dmg)
    export APPLE_SIGNING_IDENTITY APPLE_ID APPLE_TEAM_ID APPLE_APP_PASSWORD
    sh "$app_dir/scripts/check-macos-release-env.sh"
    # Tauri expects APPLE_PASSWORD for Apple-ID notarization.
    export APPLE_PASSWORD="$APPLE_APP_PASSWORD"
    bundles=dmg
    ;;
esac
cd "$app_dir"
# Cargo and Tauri must use the same target directory, including overrides.
export CARGO_TARGET_DIR=${CARGO_TARGET_DIR:-$app_dir/src-tauri/target}
case "$CARGO_TARGET_DIR" in
  /*) ;;
  *) CARGO_TARGET_DIR="$app_dir/$CARGO_TARGET_DIR" ;;
esac
sh scripts/stage-pdfium.sh "$target"
echo "Building $architecture ($target); output: $CARGO_TARGET_DIR/$target/release/bundle"
exec tauri build --target "$target" --bundles "$bundles" --config "src-tauri/tauri.bundle.$architecture.json"
