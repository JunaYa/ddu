#!/bin/sh
set -eu
# Compatibility entry point for certificate-signed local builds.
exec sh "$(dirname "$0")/build-macos.sh" signed "$@"
