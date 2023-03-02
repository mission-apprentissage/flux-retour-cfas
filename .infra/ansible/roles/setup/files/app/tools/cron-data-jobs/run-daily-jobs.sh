#!/usr/bin/env bash
set -euo pipefail

#################################################
# Script d'éxecution des jobs quotidiens
#################################################

readonly LOG_FILEPATH="/var/log/data-jobs/run_daily_jobs_$(date +'%Y-%m-%d_%H%M%S').log"

call_daily_jobs_with_logs(){
  # Remplissage des organismes issus du référentiel
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:organismes-referentiel" || true

  # Remplissage des organismes depuis le référentiel
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:organismes" || true
  
  # Remplissage des réseaux
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:reseaux" || true

  # Construction & application de la fiabilisation des couples UAI - SIRET
  docker exec flux_retour_cfas_server bash -c "yarn cli fiabilisation:uai-siret:build" || true
  docker exec flux_retour_cfas_server bash -c "yarn cli fiabilisation:uai-siret:apply" || true

  # Mise à jour des organismes via APIs externes
  docker exec flux_retour_cfas_server bash -c "yarn cli update:organismes-with-apis" || true

  # Purge des données inutiles
  docker exec flux_retour_cfas_server bash -c "yarn cli purge:events" || true
} 

call_daily_jobs_with_logs >> ${LOG_FILEPATH}
