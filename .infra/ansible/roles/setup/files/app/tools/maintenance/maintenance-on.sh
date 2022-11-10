#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

echo "Mise en place de la page de maintenance..."
docker exec -ti flux_retour_cfas_reverse_proxy bash -c "touch /etc/nginx/html/maintenance.on"
