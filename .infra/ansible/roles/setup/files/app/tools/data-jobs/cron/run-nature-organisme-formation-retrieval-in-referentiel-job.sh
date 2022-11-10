#!/usr/bin/env bash
set -euo pipefail

readonly LOG_FILEPATH="/var/log/data-jobs/log_nature_organisme_formation_referentiel_job_$(date +'%Y-%m-%d_%H%M%S').log"

call_nature_organisme_formation_job_with_log(){
  docker exec flux_retour_cfas_server bash -c "yarn retrieve-nature-organismes-de-formation" >> ${LOG_FILEPATH}
} 

call_nature_organisme_formation_job_with_log