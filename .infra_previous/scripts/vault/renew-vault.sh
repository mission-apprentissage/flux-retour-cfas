#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly ANSIBLE_DIR="${SCRIPT_DIR}/../../ansible"
readonly VAULT_FILE="${ANSIBLE_DIR}/roles/setup/vars/main/vault.yml"

function renew() {
  local previous_vault_password_file="${ANSIBLE_DIR}/.vault-password-previous.gpg"
  local vault_password_file="${ANSIBLE_DIR}/.vault-password.gpg"

  echo "Backuping previous vault password..."
  mv "${vault_password_file}" "${previous_vault_password_file}"

  echo "Generating new vault password..."
  bash "${SCRIPT_DIR}/generate-vault-password.sh"

  echo "Using new password to re-encrypt vault file..."
  ansible-vault rekey \
    --vault-id "previous@${SCRIPT_DIR}/get-vault-password-client.sh" \
    --new-vault-id "default@${SCRIPT_DIR}/get-vault-password-client.sh" \
    "${VAULT_FILE}"

  rm "${previous_vault_password_file}"
}

renew "$@"
