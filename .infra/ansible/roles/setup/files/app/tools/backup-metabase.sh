#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

readonly BACKUP_NAS_DIR="/mnt/backups/metabase"
readonly BACKUP_LOCAL_DIR="/opt/flux-retour-cfas/backups/metabase"

stop_container() {
  bash /opt/flux-retour-cfas/stop-app.sh metabase
}

restart_container() {
  local CURRENT_BRANCH
  CURRENT_BRANCH="$(git --git-dir=/opt/flux-retour-cfas/repository/.git rev-parse --abbrev-ref HEAD)"

  NO_UPDATE=true bash /opt/flux-retour-cfas/start-app.sh "${CURRENT_BRANCH}" --no-deps metabase
}

function backup_metabase(){
  echo "Sauvegarde de la base metabase..."

  stop_container
  mkdir -p /opt/flux-retour-cfas/backups/metabase
  tar -zcvf "/opt/flux-retour-cfas/backups/metabase/metabase-$(date +'%Y-%m-%d_%H%M%S').tar.gz" \
    -C /opt/flux-retour-cfas/data/metabase .
  restart_container
    
  echo "Sauvegarde terminée."
}

function replicate_backups() {
  echo "Replicating backups..."
  mkdir -p "${BACKUP_NAS_DIR}"
  rsync -rltzv "${BACKUP_LOCAL_DIR}/" "${BACKUP_NAS_DIR}/"
}

function remove_old_backups() {
  echo "Removing local backups older than 7 days..."
  find "${BACKUP_LOCAL_DIR}" -mindepth 1 -maxdepth 1 -prune -ctime +7 -exec rm -r "{}" \;
  find "${BACKUP_NAS_DIR}" -mindepth 1 -maxdepth 1 -prune -ctime +30 -exec rm -r "{}" \;
}


backup_metabase
replicate_backups
remove_old_backups
