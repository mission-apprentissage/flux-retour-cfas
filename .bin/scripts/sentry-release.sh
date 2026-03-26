#!/usr/bin/env bash

set -euo pipefail

export COMMIT_ID="${1:?"Veuillez préciser le commit ID"}"
shift 1

export SENTRY_AUTH_TOKEN=$(sops --decrypt --extract '["SENTRY_AUTH_TOKEN"]' ${ROOT_DIR}/.infra/env.global.yml)

export SENTRY_DSN=$(sops --decrypt --extract '["LBA_SERVER_SENTRY_DSN"]' ${ROOT_DIR}/.infra/env.global.yml)
cd "$ROOT_DIR/server"
"./sentry-release-server.sh" "mission-apprentissage/flux-retour-cfas" "${COMMIT_ID}"
