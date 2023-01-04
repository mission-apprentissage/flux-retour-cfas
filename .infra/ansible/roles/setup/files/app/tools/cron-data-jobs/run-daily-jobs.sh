#!/usr/bin/env bash
set -euo pipefail

#################################################
# Script d'éxecution des jobs quotidiens
#################################################

readonly LOG_FILEPATH="/var/log/data-jobs/log_$(date +'%Y-%m-%d_%H%M%S').log"

call_daily_jobs_with_logs(){
  # Remplissage des organismes
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:organismes" || true >> ${LOG_FILEPATH}
  
  # Remplissage des réseaux depuis csv fournis
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:reseaux-newFormat" || true >> ${LOG_FILEPATH}

  # Récupération des formations & du niveau des formations dans les dossiersApprenants
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:formations" || true >> ${LOG_FILEPATH}

  # Remplissage de la collection EffectifsApprenants
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:effectifsApprenants" || true >> ${LOG_FILEPATH}

  # Purge des données inutiles
  docker exec flux_retour_cfas_server bash -c "yarn cli purge:events" || true >> ${LOG_FILEPATH}

  # Warm-up cache avec calculs effectifs coûteux
  docker exec flux_retour_cfas_server bash -c "yarn cli cache:warmup" || true >> ${LOG_FILEPATH}
} 

call_daily_jobs_with_logs
