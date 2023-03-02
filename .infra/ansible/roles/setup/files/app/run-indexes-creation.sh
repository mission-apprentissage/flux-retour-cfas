#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

readonly LOG_FILEPATH="/var/log/data-jobs/run-indexes-creation_$(date +'%Y-%m-%d_%H%M%S').log"

run_indexes_creation(){
    echo "Création des index mongoDb ..."
    docker exec flux_retour_cfas_server bash -c "yarn cli indexes:create" 2>&1 | tee ${LOG_FILEPATH}
} 

run_indexes_creation
