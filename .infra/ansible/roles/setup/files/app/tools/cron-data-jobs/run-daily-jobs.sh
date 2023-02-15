#!/usr/bin/env bash
set -euo pipefail

#################################################
# Script d'éxecution des jobs quotidiens
#################################################

readonly LOG_FILEPATH="/var/log/data-jobs/run_daily_jobs_$(date +'%Y-%m-%d_%H%M%S').log"

call_daily_jobs_with_logs(){
  # Remplissage des organismes issus du référentiel
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:organismes-referentiel" || true

  # Remplissage des organismes et des formations liées
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:organismes-and-formations" || true
  
  # Remplissage des réseaux depuis csv fournis
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:reseaux-newFormat" || true

  # Purge des données inutiles
  docker exec flux_retour_cfas_server bash -c "yarn cli purge:events" || true
} 

call_daily_jobs_with_logs >> ${LOG_FILEPATH}
