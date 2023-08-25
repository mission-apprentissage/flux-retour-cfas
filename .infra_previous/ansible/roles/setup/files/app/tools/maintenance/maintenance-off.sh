#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

echo "Désactivation de la page de maintenance..."
docker exec -ti flux_retour_cfas_reverse_proxy bash -c "rm /etc/nginx/html/*.on"
