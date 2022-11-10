#!/usr/bin/env bash
set -euo pipefail

readonly TEXT_MESSAGE=${1:?"Please provide a text message"}
readonly SLACK_URL="{{ vault.FLUX_RETOUR_CFAS_SLACK_WEBHOOK_URL }}"
readonly CHANNEL_NAME="#tableau-de-bord-alerting"
readonly MNA_ENV=$(cat /env)

curl -s -o /dev/null -X POST --data-urlencode \
  "payload={\"text\": \"[${MNA_ENV}] ${TEXT_MESSAGE}\", \"channel\": \"${CHANNEL_NAME}\" }" "${SLACK_URL}"
