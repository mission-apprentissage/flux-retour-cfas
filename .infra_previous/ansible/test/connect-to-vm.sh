#!/usr/bin/env bash
set -euo pipefail

readonly TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "${TEST_DIR}"
vagrant  ssh
cd -
