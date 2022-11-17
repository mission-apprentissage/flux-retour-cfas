#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

readonly BACKUP_NAME="$(date +'%Y-%m-%d_%H%M%S')"
readonly TARGET_FOLDER=${1:?"Merci de préciser le chemin du repertoire ou copier le dump -- ex: /home/moi"}
readonly SPECIFIC_COLLECTION=${2:-""}

# Backup mongo in container
function backup_mongo_in_container() {
 echo "--- Création du dump ${BACKUP_NAME} ..."

 local collection_option=""
 if [[ ${SPECIFIC_COLLECTION} != "" ]]; then
   collection_option="--collection=${SPECIFIC_COLLECTION}"
   echo "--- Création du dump avec l'option ${collection_option} ..."
 fi
 docker exec flux_retour_cfas_mongodb bash -c "mkdir -p /data/backups/"
 docker exec flux_retour_cfas_mongodb bash -c "mongodump -h localhost -d flux-retour-cfas ${collection_option} --gzip --out /data/backups/${BACKUP_NAME}"
 echo "Dump des DossiersApprenants disponible ici : /data/backups/${BACKUP_NAME}"
}

# Move dump to target folder
function move_dump() {
 docker cp flux_retour_cfas_mongodb:/data/backups/${BACKUP_NAME} ${TARGET_FOLDER}
 echo "Dump copié depuis le container flux_retour_cfas_mongodb vers ${TARGET_FOLDER} avec succès !"
}

# Clear dump from container folder
function clear_dump() {
 docker exec flux_retour_cfas_mongodb bash -c "rm -r /data/backups/${BACKUP_NAME}"
 echo "Dump des DossiersApprenants supprimé du conteneur flux_retour_cfas_mongodb dans /data/backups/${BACKUP_NAME}"
}

backup_mongo_in_container
move_dump
clear_dump