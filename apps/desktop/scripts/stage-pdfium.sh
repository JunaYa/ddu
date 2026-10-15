#!/bin/sh
set -eu

# LiteParse (OCR) loads PDFium at runtime, so the app bundle must ship it.
# The architecture-specific bundle config lists it under bundle.macOS.frameworks, and
# tauri-build checks that file exists at compile time — so build just the
# PDFium sys crate (its build script fetches the dylib into target/*/deps)
# and stage the dylib before `tauri build` starts.

root=$(cd "$(dirname "$0")/.." && pwd)
manifest="$root/src-tauri/Cargo.toml"
dest="$root/src-tauri/frameworks"
. "$root/scripts/macos-target.sh"
target=$(resolve_macos_target "${1-}")
case "$target" in
  aarch64-apple-darwin) architecture=arm64 ;;
  x86_64-apple-darwin) architecture=x86_64 ;;
esac
cd "$root"
target_dir=${CARGO_TARGET_DIR:-$root/src-tauri/target}
dest="$dest/$target"

cargo build --locked --release --target "$target" --target-dir "$target_dir" --manifest-path "$manifest" -p liteparse-pdfium-sys

src="$target_dir/$target/release/deps/libpdfium.dylib"
if [ ! -f "$src" ]; then
  echo "libpdfium.dylib not found at $src — OCR cannot ship without it." >&2
  exit 1
fi

actual=$(lipo -archs "$src")
if [ "$actual" != "$architecture" ]; then
  echo "PDFium architecture mismatch: expected $architecture, found $actual ($src)." >&2
  exit 1
fi

mkdir -p "$dest"
cp "$src" "$dest/libpdfium.dylib"
echo "Staged $src"
