#!/usr/bin/env bash
set -euo pipefail

readonly LOG_FILEPATH="/var/log/data-jobs/run_process_effectifs_queue_job_$(date +'%Y-%m-%d_%H%M%S').log"

call_job_with_logs(){
  docker exec flux_retour_cfas_server bash -c "yarn cli process:effectifs-queue"
} 

call_job_with_logs >> ${LOG_FILEPATH}
