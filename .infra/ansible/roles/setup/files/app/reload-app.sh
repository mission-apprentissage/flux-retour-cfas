#!/usr/bin/env bash
set -euo pipefail

readonly PROJECT_DIR="/opt/flux-retour-cfas"
readonly REPO_DIR="/opt/flux-retour-cfas/repository"

function reload_containers() {
  cd "${REPO_DIR}"
  git fetch
  if [[ $(git rev-parse HEAD) == $(git rev-parse @{u}) ]]; then
    echo "Repository already up to date. No need to rebuild application"
  else
    echo "Rebuilding application..."
    bash "${PROJECT_DIR}/start-app.sh" "$(git --git-dir=${REPO_DIR}/.git rev-parse --abbrev-ref HEAD)"
    bash "${PROJECT_DIR}/tools/send-to-slack.sh" "Application has been deployed on $(cat /env)"
  fi
  cd - >/dev/null
}

echo "****************************"
echo "[$(date +'%Y-%m-%d_%H%M%S')] Running ${BASH_SOURCE[0]} $*"
echo "****************************"
reload_containers
