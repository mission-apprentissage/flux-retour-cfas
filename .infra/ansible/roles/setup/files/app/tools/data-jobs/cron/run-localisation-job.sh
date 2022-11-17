#!/usr/bin/env bash
set -euo pipefail

readonly LOG_FILEPATH="/var/log/data-jobs/log_localisation_job_$(date +'%Y-%m-%d_%H%M%S').log"

call_localisation_job_with_log(){
  docker exec flux_retour_cfas_server bash -c "yarn retrieve-location-from-uai" >> ${LOG_FILEPATH}
} 

call_localisation_job_with_log