#!/bin/sh
set -eu

# LiteParse (OCR) loads PDFium at runtime, so the app bundle must ship it.
# tauri.bundle.conf.json lists it under bundle.macOS.frameworks, and
# tauri-build checks that file exists at compile time — so build just the
# PDFium sys crate (its build script fetches the dylib into target/*/deps)
# and stage the dylib before `tauri build` starts.

root=$(cd "$(dirname "$0")/.." && pwd)
manifest="$root/src-tauri/Cargo.toml"
dest="$root/src-tauri/frameworks"

cargo build --release --manifest-path "$manifest" -p liteparse-pdfium-sys

src="$root/src-tauri/target/release/deps/libpdfium.dylib"
if [ ! -f "$src" ]; then
  echo "libpdfium.dylib not found at $src — OCR cannot ship without it." >&2
  exit 1
fi

mkdir -p "$dest"
cp "$src" "$dest/libpdfium.dylib"
echo "Staged $src"
