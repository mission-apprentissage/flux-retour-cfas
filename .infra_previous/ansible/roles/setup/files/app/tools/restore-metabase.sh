#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

readonly BACKUP_FILE=${1:?"Please provide a backup file path $(echo '' && find /mnt/backups/metabase)"}; shift;

stop_container() {
  bash /opt/flux-retour-cfas/stop-app.sh metabase
}

restart_container() {
  local CURRENT_BRANCH
  CURRENT_BRANCH="$(git --git-dir=/opt/flux-retour-cfas/repository/.git rev-parse --abbrev-ref HEAD)"

  NO_UPDATE=true bash /opt/flux-retour-cfas/start-app.sh "${CURRENT_BRANCH}" --no-deps metabase
}

function restore_metabase(){
  echo "Restauration de la base metabase..."

  stop_container
  tar -xvf "${BACKUP_FILE}" -C /opt/flux-retour-cfas/data/metabase
  restart_container

  echo "Restauration terminée."
}

restore_metabase
