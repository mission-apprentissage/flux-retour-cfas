#!/usr/bin/env bash

set -euo pipefail

export ENVIRONMENT="${1:?"Veuillez préciser l'environement"}";
shift

export VERSION="${1:?"Veuillez préciser la version"}";
shift

# En CI : jeton fourni par le secret GitHub SENTRY_AUTH_TOKEN (aucune clé
# OpenPGP sur les runners hébergés). En local : lu dans les fichiers SOPS.
if [[ -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
  SENTRY_AUTH_TOKEN="$(sops --decrypt --extract '["SENTRY_AUTH_TOKEN"]' "${ROOT_DIR}/.infra/env.global.yml")"
fi
export SENTRY_AUTH_TOKEN

cd "$ROOT_DIR/server"
"./sentry-deploy-server.sh" "${ENVIRONMENT}" "${VERSION}"
