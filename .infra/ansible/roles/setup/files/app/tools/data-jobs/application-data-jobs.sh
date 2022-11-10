#!/usr/bin/env bash
set -euo pipefail

# Création / Mise à jour des cfas & données annuaire
docker exec flux_retour_cfas_server bash -c "yarn seed:clearAssets" || true
docker exec flux_retour_cfas_server bash -c "yarn seed:cfas" || true
docker exec flux_retour_cfas_server bash -c "yarn seed:contactsCfas" || true

# Récupération des formations & du niveau des formations dans les dossiersApprenants
docker exec flux_retour_cfas_server bash -c "yarn seed:formations" || true

# Synchronisation des données liées au TCO / Catalogue dans les dossiersApprenants
docker exec flux_retour_cfas_server bash -c "yarn retrieve-location-from-uai" || true
docker exec flux_retour_cfas_server bash -c "yarn clear:dossiersApprenants-networks" || true
docker exec flux_retour_cfas_server bash -c "yarn dossiersApprenants:retrieve-networks" || true
docker exec flux_retour_cfas_server bash -c "yarn dossiersApprenants:retrieve-formateurs-gestionnaires-in-catalog" || true
docker exec flux_retour_cfas_server bash -c "yarn retrieve-formation-rncp-in-tco" || true

# Calcul de la collection EffectifsApprenants
docker exec flux_retour_cfas_server bash -c "yarn create:effectifsApprenants-collection" || true

# Purge des données inutiles
docker exec flux_retour_cfas_server bash -c "yarn purge:events" || true

# Warm-up cache avec calculs effectifs coûteux
docker exec flux_retour_cfas_server bash -c "yarn cache:warmup" || true

