#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly ANSIBLE_DIR="${SCRIPT_DIR}/../../ansible"
readonly HABILITATIONS_FILE="${ANSIBLE_DIR}/roles/setup/vars/main/habilitations.yml"
readonly VAULT_PASSWORD_FILE="${ANSIBLE_DIR}/.vault-password.gpg"

function create_password_file() {
  local recipients=()
  local password
  password="$(pwgen -n 71 -C | head -n1)"

  if test -f "${VAULT_PASSWORD_FILE}"; then
    echo "Le fichier ${VAULT_PASSWORD_FILE} a déjà été créé."
    exit 1
  fi

  echo "Extracting gpg keys from habilitations file..."
  mapfile -t keys < <(grep "gpg_key:" "${HABILITATIONS_FILE}" | awk -F ":" '{print $2}' | sed '/^$/d' | tr -d ' ')

  echo "Fetching gpg keys and add them as a recipients..."
  for key in "${keys[@]}"; do
    echo $key
    gpg --quiet --recv-keys "$key"
    recipients+=("--recipient $key")
  done

  echo "Generating vault password..."
  echo "${password}" | gpg --quiet --always-trust --armor ${recipients[*]} -e -o "${VAULT_PASSWORD_FILE}"
}

create_password_file
