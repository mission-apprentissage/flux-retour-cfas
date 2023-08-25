#!/usr/bin/env bash
set -euo pipefail

readonly LOG_FILEPATH="/var/log/data-jobs/run_hourly_jobs_$(date +'%Y-%m-%d_%H%M%S').log"

call_hourly_jobs_with_logs(){
  # Mise a jour du nb d'effectifs des organismes
  docker exec flux_retour_cfas_server bash -c "yarn cli hydrate:organismes-effectifs-count"
} 

call_hourly_jobs_with_logs >> ${LOG_FILEPATH}
