#!/bin/sh
set -eu

# Local macOS builds must carry a stable, certificate-based signature.
#
# An ad-hoc bundle has no designated requirement, so macOS TCC falls back to
# keying the Screen Recording grant on the executable's cdhash. That hash
# changes on every rebuild, which silently revokes the grant while System
# Settings still shows the toggle enabled. The build itself succeeds, so the
# breakage only shows up later as "I granted it and capture still asks".
#
# Refusing to build is the point: a missing identity must be loud.

app_dir=$(cd "$(dirname "$0")/.." && pwd)
repo_root=$(cd "$app_dir/../.." && pwd)

if [ -f "$repo_root/.env.local" ]; then
  . "$repo_root/.env.local"
fi

if [ -z "${APPLE_SIGNING_IDENTITY-}" ]; then
  echo "APPLE_SIGNING_IDENTITY is not set — refusing to produce an ad-hoc build." >&2
  echo >&2
  echo "An unsigned bundle loses its Screen Recording grant on every rebuild." >&2
  echo >&2
  echo "Set it in .env.local at the repo root (gitignored):" >&2
  echo "  APPLE_SIGNING_IDENTITY=\"Apple Development: you@example.com (XXXXXXXXXX)\"" >&2
  echo >&2
  echo "List your identities with:" >&2
  echo "  security find-identity -v -p codesigning" >&2
  echo >&2
  echo "To build unsigned anyway (TCC grants will not persist):" >&2
  echo "  vp run desktop#build:native:adhoc" >&2
  exit 1
fi

export APPLE_SIGNING_IDENTITY
echo "Signing with identity: $APPLE_SIGNING_IDENTITY"

cd "$app_dir"
sh scripts/stage-pdfium.sh
exec tauri build --bundles app --config src-tauri/tauri.bundle.conf.json
