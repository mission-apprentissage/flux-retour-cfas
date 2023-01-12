#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

readonly BACKUP_NAME=${1:?"Merci de préciser le nom du dump"}
readonly BACKUP_PATH_NAME=${2:?"Merci de préciser le chemin complet du dump -- ex: /home/moi/2021-07-01-000000/flux-retour-cfas"}
readonly DATAJOBS_SCRIPT_PATH="/opt/flux-retour-cfas/tools/data-jobs/application-data-jobs.sh"
readonly RUN_DATAJOBS_MODE=${3:?"Merci de préciser si vous souhaitez lancer les dataJobs -- dataJobsOn / dataJobsOff"}
readonly CLEAR_CACHE_MODE=${4:?"Merci de préciser si vous souhaitez vider le cache --  clearCacheOn / clearCacheOff"}
readonly SPECIFIC_COLLECTION=${5:-""}

function copy_dump_to_container() {
 echo "--- Copie du dump ${BACKUP_NAME} dans le conteneur mongoDb..."
 docker exec flux_retour_cfas_mongodb bash -c "mkdir -p /data/backups/"
 docker cp ${BACKUP_PATH_NAME} flux_retour_cfas_mongodb:/data/backups/${BACKUP_NAME}
}

function restore_dump() {
 echo "--- Restore du dump ${BACKUP_NAME} dans le conteneur mongoDb..."

 local collection_option=""
 if [[ ${SPECIFIC_COLLECTION} != "" ]]; then
   collection_option="--nsInclude=flux-retour-cfas.${SPECIFIC_COLLECTION}"
   echo "--- Création du dump avec l'option ${collection_option} ..."
 fi

 docker exec flux_retour_cfas_mongodb bash -c \
    "mongorestore --gzip --drop ${collection_option} --uri mongodb://localhost:27017/flux-retour-cfas /data/backups/${BACKUP_NAME}"

 echo "Restauration executée avec succès !"
}

function next_steps(){
 if [ ${RUN_DATAJOBS_MODE} == "dataJobsOn" ]
 then
    echo "--- Lancement des datajobs ..."
    bash ${DATAJOBS_SCRIPT_PATH}
 fi

 if [ ${CLEAR_CACHE_MODE} == "clearCacheOn" ]
 then
    echo "--- Nettoyage du cache ..."
    docker exec -it flux_retour_cfas_redis redis-cli FLUSHALL
 fi
}

copy_dump_to_container
restore_dump
next_steps