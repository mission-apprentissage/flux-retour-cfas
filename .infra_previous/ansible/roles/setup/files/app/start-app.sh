#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

readonly REPO_DIR="/opt/flux-retour-cfas/repository"
readonly BRANCH=${1:?"Merci de préciser le nom de la branche (ex. master)"}; shift;

function update_repository() {
    echo "Mise à jour du repository..."

    cd "${REPO_DIR}"
    git fetch
    git checkout "${BRANCH}"
    git reset --hard "origin/${BRANCH}"
    cd -
}

function reload_containers() {
    echo "Rechargement des conteneurs ..."

    cd "${REPO_DIR}"
    /usr/local/bin/docker-compose \
      -f "${REPO_DIR}/docker-compose.yml" \
      -f "/opt/flux-retour-cfas/.overrides/docker-compose.common.yml" \
      -f "/opt/flux-retour-cfas/.overrides/docker-compose.env.yml" \
      --project-name flux-retour-cfas \
      up -d --force-recreate --build --remove-orphans --renew-anon-volumes $*
    cd -
}

function clean_docker() {
    echo "Removing dangling data built two weeks ago..."
    docker system prune -f --filter "until=360h"
}

if [[ "${NO_UPDATE:-"false"}" == "true" ]]; then
  echo "Update ignored"
else
  update_repository
fi

echo "****************************"
echo "[$(date +'%Y-%m-%d_%H%M%S')] Running ${BASH_SOURCE[0]} $*"
echo "****************************"
reload_containers "$@"
clean_docker
