#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

readonly LOG_DIR="/var/log/data-jobs"

if [ ! -d "$LOG_DIR" ]; then
    sudo mkdir -p "$LOG_DIR"
    sudo chown $(whoami):$(whoami) "$LOG_DIR"
fi

trigger_indexes_creation(){
    echo "Création des index mongoDb ..."
    docker compose run --rm --no-deps server yarn cli indexes:create --queued
} 

trigger_indexes_creation
