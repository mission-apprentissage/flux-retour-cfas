#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

docker exec -it flux_retour_cfas_mongodb mongosh "{{ vault[env_type].FLUX_RETOUR_CFAS_MONGODB_URI }}" "$@"
