#!/usr/bin/env bash
set -euo pipefail

readonly DATAJOBS_SCRIPT_PATH="/opt/flux-retour-cfas/tools/data-jobs/application-data-jobs.sh"
readonly LOG_FILEPATH="/var/log/data-jobs/log_$(date +'%Y-%m-%d_%H%M%S').log"

call_data_jobs(){
  bash ${DATAJOBS_SCRIPT_PATH} >> ${LOG_FILEPATH}
} 

call_data_jobs