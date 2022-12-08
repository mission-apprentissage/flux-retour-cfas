#!/usr/bin/env bash
set -euo pipefail

#################################################
# Script d'éxecution des jobs quotidiens
#################################################

# Remplissage des organismes & réseaux liés
docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:organismes" || true
docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:reseaux" || true
docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:reseaux-newFormat" || true

# Remplissage des formations
docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:formations" || true

# Récupération des formations & du niveau des formations dans les dossiersApprenants
docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:formations" || true

# Remplissage de la collection EffectifsApprenants
docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:effectifsApprenants" || true

# Purge des données inutiles
docker exec flux_retour_cfas_server bash -c "yarn cli purge:events" || true

# Warm-up cache avec calculs effectifs coûteux
docker exec flux_retour_cfas_server bash -c "yarn cli cache:warmup" || true

