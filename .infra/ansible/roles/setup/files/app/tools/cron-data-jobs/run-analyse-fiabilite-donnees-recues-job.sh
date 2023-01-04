#!/usr/bin/env bash
set -euo pipefail

readonly LOG_FILEPATH="/var/log/data-jobs/run_analyse_fiabilite_donnees_recues_job_$(date +'%Y-%m-%d_%H%M%S').log"

call_analyse_fiabilite_job_with_logs(){
  docker exec flux_retour_cfas_server bash -c "yarn cli:fiabilisation analyse:dossiersApprenants-recus" || true >> ${LOG_FILEPATH}
} 

call_analyse_fiabilite_job_with_logs
