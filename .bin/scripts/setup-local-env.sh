#!/usr/bin/env bash

set -euo pipefail

echo "Updating local server/.env & ui/.env"

delete_cleartext() {
  if [ -f "${ROOT_DIR}/.vault_pwd.txt" ]; then
    shred -f -n 10 -u "${ROOT_DIR}/.vault_pwd.txt"
  fi
}

trap delete_cleartext EXIT
"${SCRIPT_DIR}/get-vault-password-client.sh" > "${ROOT_DIR}/.vault_pwd.txt"

MSYS_NO_PATHCONV=1 docker run -it --rm \
  -v "${ROOT_DIR}:/root" \
  -e ANSIBLE_CONFIG="/root/.infra/ansible/ansible.cfg" \
  alpine/ansible sh -c 'chmod 0600 /root/.vault_pwd.txt && ansible all \
    --limit "local" \
    -m template \
    -a "src=\"/root/.infra/.env_server\" dest=\"/root/server/.env\"" \
    --extra-vars "@root/.infra/vault/vault.yml" \
    --vault-password-file="/root/.vault_pwd.txt"'

MSYS_NO_PATHCONV=1 docker run -it --rm \
  -v "${ROOT_DIR}:/root" \
  -e ANSIBLE_CONFIG="/root/.infra/ansible/ansible.cfg" \
  alpine/ansible sh -c 'chmod 0600 /root/.vault_pwd.txt && ansible all \
    --limit "local" \
    -m template \
    -a "src=\"/root/.infra/.env_ui\" dest=\"/root/ui/.env\"" \
    --extra-vars "@root/.infra/vault/vault.yml" \
    --vault-password-file="/root/.vault_pwd.txt"'

echo "PUBLIC_VERSION=0.0.0-local" >> "${ROOT_DIR}/server/.env"

echo "NEXT_PUBLIC_ENV=local" >> "${ROOT_DIR}/ui/.env"
echo "NEXT_PUBLIC_VERSION=0.0.0-local" >> "${ROOT_DIR}/ui/.env"
echo "NEXT_PUBLIC_API_PORT=5001" >> "${ROOT_DIR}/ui/.env"

yarn services:start
yarn build:dev
yarn cli migrations:up
yarn cli indexes:create
