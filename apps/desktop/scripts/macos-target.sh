#!/bin/sh
# Sourced by the build and dependency-staging scripts.
resolve_macos_target() {
  requested=${1:-$(rustc -vV | sed -n 's/^host: //p')}
  case "$requested" in
    arm64|aarch64|aarch64-apple-darwin) echo aarch64-apple-darwin ;;
    x64|x86_64|x86_64-apple-darwin) echo x86_64-apple-darwin ;;
    *) echo "Unsupported macOS target: $requested. Use arm64 or x64." >&2; return 1 ;;
  esac
}
