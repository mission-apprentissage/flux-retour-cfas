#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

readonly LOG_DIR="/var/log/data-jobs"
readonly LOG_FILEPATH="${LOG_DIR}/run-indexes-creation_$(date +'%Y-%m-%d_%H%M%S').log"

if [ ! -d "$LOG_DIR" ]; then
    sudo mkdir -p "$LOG_DIR"
    sudo chown $(whoami):$(whoami) "$LOG_DIR"
fi

trigger_indexes_creation(){
    echo "Création des index mongoDb ..."
    docker compose run --rm --no-deps server yarn cli indexes:create --queued 2>&1 | tee "$LOG_FILEPATH"
} 

trigger_indexes_creation
