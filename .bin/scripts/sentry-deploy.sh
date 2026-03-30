#!/usr/bin/env bash

set -euo pipefail

export ENVIRONMENT="${1:?"Veuillez préciser l'environement"}";
shift

export VERSION="${1:?"Veuillez préciser la version"}";
shift

export SENTRY_AUTH_TOKEN=$(sops --decrypt --extract '["SENTRY_AUTH_TOKEN"]' ${ROOT_DIR}/.infra/env.global.yml)

export SENTRY_DSN=$(sops --decrypt --extract '["SERVER_SENTRY_DSN"]' ${ROOT_DIR}/.infra/env.global.yml)
cd "$ROOT_DIR/server"
"./sentry-deploy-server.sh" "${ENVIRONMENT}" "${VERSION}"
