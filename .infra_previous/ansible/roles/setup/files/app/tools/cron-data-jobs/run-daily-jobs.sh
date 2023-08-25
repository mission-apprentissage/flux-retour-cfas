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

  # Mise à jour des relations
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:organismes-relations" || true
  
  # Remplissage des réseaux
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:reseaux" || true

  # Lancement des scripts de fiabilisation des couples UAI - SIRET
  docker exec flux_retour_cfas_server bash -c "yarn cli fiabilisation:uai-siret:run" || true

  # Mise à jour des organismes via APIs externes
  docker exec flux_retour_cfas_server bash -c "yarn cli update:organismes-with-apis" || true

  # Mise à jour des niveaux des formations des effectifs 
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:effectifs-formation-niveaux" || true

  # Purge des collections events et queues
  docker exec flux_retour_cfas_server bash -c "yarn cli purge:events" || true
  docker exec flux_retour_cfas_server bash -c "yarn cli purge:queues" || true

  # Mise a jour du nb d'effectifs
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:organismes-effectifs-count" || true

  # Fiabilisation des effectifs : suppression des inscrits sans contrats depuis 90 jours & transformation des rupturants en abandon > 180 jours
  docker exec flux_retour_cfas_server bash -c "yarn cli fiabilisation:effectifs:remove-inscritsSansContrats-depuis-nbJours" || true
  docker exec flux_retour_cfas_server bash -c "yarn cli fiabilisation:effectifs:transform-rupturants-en-abandons-depuis" || true
} 

call_daily_jobs_with_logs >> ${LOG_FILEPATH}
