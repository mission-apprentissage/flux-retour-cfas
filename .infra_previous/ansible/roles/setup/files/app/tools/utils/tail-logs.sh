#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

readonly PROJECT_DIR="/opt/flux-retour-cfas/repository"

function tail_logs() {
    echo "Rechargement des conteneurs ..."

    cd "${PROJECT_DIR}"
    /usr/local/bin/docker-compose \
      -f "${PROJECT_DIR}/docker-compose.yml" \
      -f "/opt/flux-retour-cfas/.overrides/docker-compose.common.yml" \
      -f "/opt/flux-retour-cfas/.overrides/docker-compose.env.yml" \
      --project-name flux-retour-cfas \
      logs "$@"
    cd -
}

tail_logs "$@"
