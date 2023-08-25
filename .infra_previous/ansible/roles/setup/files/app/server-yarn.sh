#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

echo "****************************"
echo "[$(date +'%Y-%m-%d_%H%M%S')] Running ${BASH_SOURCE[0]} $*"
echo "****************************"

docker exec flux_retour_cfas_server yarn --silent "$@"
