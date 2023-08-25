#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "/opt/flux-retour-cfas/data/ssl/privkey.pem" ]; then
cd "${SCRIPT_DIR}"
docker build --tag flux_retour_cfas_certbot certbot/
docker run --rm --name flux_retour_cfas_certbot \
  -p 80:5000 \
  -v /opt/flux-retour-cfas/data/certbot:/etc/letsencrypt \
  -v /opt/flux-retour-cfas/data/ssl:/ssl \
  flux_retour_cfas_certbot generate "$@"
cd -
else
  echo "Certificat SSL déjà généré"
fi
