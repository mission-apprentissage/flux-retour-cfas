#!/usr/bin/env bash

set -euo pipefail

if [ -z "${SCRIPT_DIR:-}" ]; then
  export SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

if [ -z "${ROOT_DIR:-}" ]; then
  export ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
fi

defaultMode=""
if [ ! -z "${CI:-}" ]; then
  defaultMode="push"
else
  defaultMode="load"
fi

next_version="${1:?"Veuillez préciser la version"}"
shift 1

mode=${1:-$defaultMode}
shift 1

"$ROOT_DIR"/.bin/mna-lba app:build $next_version $mode "production"
