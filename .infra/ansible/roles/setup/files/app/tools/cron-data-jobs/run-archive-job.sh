#!/usr/bin/env bash
set -euo pipefail

readonly LOG_FILEPATH="/var/log/data-jobs/log_archive_job_$(date +'%Y-%m-%d_%H%M%S').log"

call_archive_job_with_logs(){
  docker exec flux_retour_cfas_server bash -c "yarn cli archive:dossiersApprenantsEffectifs" || true >> ${LOG_FILEPATH}
} 

call_archive_job_with_logs
