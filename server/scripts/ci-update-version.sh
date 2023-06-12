#!/bin/sh -e

# This script updates config.ts with build information (commit hash and build date)

[ -n "$TRACE" ] && set -x

SCRIPT_DIR="$( cd "$( dirname "$0" )" && pwd )"
TEMPLATE_PATH="$SCRIPT_DIR"/../src/config.ts

sed -i "s#{{APPLICATION_DATE}}#$(date +'%d/%m/%Y')#" "$TEMPLATE_PATH"
sed -i "s/{{APPLICATION_VERSION}}/${GITHUB_SHA}/" "$TEMPLATE_PATH"
