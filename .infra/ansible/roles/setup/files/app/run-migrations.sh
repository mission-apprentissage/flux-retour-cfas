#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

readonly LOG_FILEPATH="/var/log/data-jobs/run-migrations_$(date +'%Y-%m-%d_%H%M%S').log"

run_migrations(){
    echo "Application des migrations mongoDb ..."
    docker exec flux_retour_cfas_server bash -c "yarn migration:up" 2>&1 | tee ${LOG_FILEPATH}
} 

run_migrations


