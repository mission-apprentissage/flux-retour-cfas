#!/usr/bin/env bash
set -euo pipefail

readonly LOG_FILEPATH="/var/log/data-jobs/log_create_referentiel_siret_uai_job_$(date +'%Y-%m-%d_%H%M%S').log"

call_create_referentiel_siret_uai_job_with_log(){
  docker exec flux_retour_cfas_server bash -c "yarn seed:referentiel-siret-uai" >> ${LOG_FILEPATH}
} 

call_create_referentiel_siret_uai_job_with_log