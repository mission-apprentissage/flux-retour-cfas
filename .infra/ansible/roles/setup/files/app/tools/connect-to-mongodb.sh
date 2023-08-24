#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

docker run -it --rm mongo:6.0.2-focal mongosh "{{ vault[env_type].FLUX_RETOUR_CFAS_MONGODB_URI }}" "$@"
