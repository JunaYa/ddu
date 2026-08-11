#!/bin/sh
set -eu

missing=""
for required in APPLE_SIGNING_IDENTITY APPLE_ID APPLE_TEAM_ID APPLE_APP_PASSWORD; do
  eval "value=\${$required-}"
  if [ -z "$value" ]; then
    missing="$missing $required"
  fi
done

if [ -n "$missing" ]; then
  echo "Missing required macOS release environment variables:$missing" >&2
  echo "A DMG must be Developer ID signed and notarized; refusing an unsigned release build." >&2
  exit 1
fi

echo "macOS release signing and notarization inputs are present."
